'use strict';

// ─────────────────────────────────────────────
//  IMPORTS
// ─────────────────────────────────────────────
require('dotenv').config();
const fs           = require('fs');
const path         = require('path');
const express      = require('express');
const jwt          = require('jsonwebtoken');
const cors         = require('cors');
const oracledb     = require('oracledb');
const bcrypt       = require('bcrypt');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const winston      = require('winston');
const crypto       = require('crypto');
const userProfileRoutes = require('./routes/userProfileRoutes');
const userPasswordRoutes = require('./routes/userPasswordRoutes');

const logsDir = path.join(__dirname, 'logs');
fs.mkdirSync(logsDir, { recursive: true });

// ─────────────────────────────────────────────
//  AUDIT LOGGER  (file + console, no sensitive data)
// ─────────────────────────────────────────────
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(logsDir, 'audit.log') }),
        new winston.transports.Console({ format: winston.format.simple() })
    ]
});

// ─────────────────────────────────────────────
//  ENV VALIDATION  (fail fast if config missing)
// ─────────────────────────────────────────────
const REQUIRED_ENV = [
    'DB_USER', 'DB_PASSWORD', 'DB_CONNECT_STRING',
    'JWT_SECRET', 'JWT_REFRESH_SECRET',
    'ALLOWED_ORIGIN', 'ORACLE_CLIENT_LIB'
];
REQUIRED_ENV.forEach(key => {
    if (!process.env[key]) {
        logger.error(`Missing required env variable: ${key}`);
        process.exit(1);               // Never start with broken config
    }
});

// JWT_SECRET must be at least 64 hex chars (256 bits)
if (process.env.JWT_SECRET.length < 64) {
    logger.error('JWT_SECRET too short — must be ≥ 64 characters');
    process.exit(1);
}

// ─────────────────────────────────────────────
//  ORACLE THICK MODE  (path from env, not hardcoded)
// ─────────────────────────────────────────────
try {
    oracledb.initOracleClient({ libDir: process.env.ORACLE_CLIENT_LIB });
    logger.info('Oracle Client initialised');
} catch (err) {
    logger.error('Oracle Client init failed', { message: err.message });
    process.exit(1);
}

// ─────────────────────────────────────────────
//  CONNECTION POOL
// ─────────────────────────────────────────────
async function initializePool() {
    try {
        await oracledb.createPool({
            user          : process.env.DB_USER,
            password      : process.env.DB_PASSWORD,
            connectString : process.env.DB_CONNECT_STRING,
            poolMin       : 2,
            poolMax       : 10,
            poolIncrement : 1,
            poolTimeout   : 60
        });
        logger.info('Database connection pool created');
    } catch (err) {
        logger.error('Pool creation failed', { message: err.message, stack: err.stack });
        process.exit(1);               // Cannot run without DB
    }
}

// ─────────────────────────────────────────────
//  IN-MEMORY TOKEN BLACKLIST
//  (replace with Redis in production for multi-node)
// ─────────────────────────────────────────────
const tokenBlacklist = new Map();          // token jti → expiry timestamp

function blacklistToken(jti, exp) {
    tokenBlacklist.set(jti, exp * 1000);   // convert Unix → ms
}

function isTokenBlacklisted(jti) {
    return tokenBlacklist.has(jti);
}

// Purge expired entries every 15 minutes
setInterval(() => {
    const now = Date.now();
    for (const [jti, expMs] of tokenBlacklist) {
        if (expMs < now) tokenBlacklist.delete(jti);
    }
}, 15 * 60 * 1000);

// ─────────────────────────────────────────────
//  EXPRESS APP
// ─────────────────────────────────────────────
const app = express();

// ── Security Headers (helmet) ──────────────────
app.use(helmet());
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc : ["'self'"],
        scriptSrc  : ["'self'"],
        objectSrc  : ["'none'"],
        upgradeInsecureRequests: []
    }
}));

// ── CORS (whitelist only) ──────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGIN
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.options(/.*/, cors(corsOptions));

app.get("/test-header", (_req, res) => {
    res.json({
        success: true,
        message: "HEADER TEST OK"
    });
});

// ── Body Parser (with size limit) ─────────────
app.use(express.json({ limit: '10kb' }));  // Prevent payload flood

app.get("/test-cors", (_req, res) => {
    res.json({
        success: true,
        message: "TEST CORS OK"
    });
});

// ── Hide server fingerprint ────────────────────
app.disable('x-powered-by');

// ── Global Request ID (for log correlation) ───
app.use((req, _res, next) => {
    req.requestId = crypto.randomUUID();
    next();
});

// ─────────────────────────────────────────────
//  RATE LIMITERS
// ─────────────────────────────────────────────

// Strict limiter for login — 5 attempts per 15 min per IP
const loginLimiter = rateLimit({
    windowMs        : 15 * 60 * 1000,
    max             : 5,
    standardHeaders : true,
    legacyHeaders   : false,
    message         : { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
    handler(req, res, next, options) {
        logger.warn('Rate limit hit on /api/login', {
            ip        : req.ip,
            requestId : req.requestId
        });
        res.status(options.statusCode).json(options.message);
    }
});

// General API limiter — 100 requests per 15 min per IP
const apiLimiter = rateLimit({
    windowMs        : 15 * 60 * 1000,
    max             : 100,
    standardHeaders : true,
    legacyHeaders   : false,
    message         : { success: false, message: 'Too many requests. Slow down.' }
});

app.use('/api/', apiLimiter);

// ─────────────────────────────────────────────
//  JWT MIDDLEWARE
// ─────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token      = authHeader && authHeader.startsWith('Bearer ')
                       ? authHeader.split(' ')[1]
                       : null;

    if (!token) {
        logger.warn('Missing token', { ip: req.ip, requestId: req.requestId });
        return res.status(401).json({ message: 'Access denied: no token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'erp-api',
        audience: 'erp-client'
    }, (err, decoded) => {
        if (err) {
            logger.warn('Invalid token', {
                ip        : req.ip,
                requestId : req.requestId,
                reason    : err.message
            });
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        // Check blacklist (for logged-out tokens)
        if (isTokenBlacklisted(decoded.jti)) {
            logger.warn('Blacklisted token used', { jti: decoded.jti, ip: req.ip });
            return res.status(403).json({ message: 'Token has been revoked' });
        }

        req.user = decoded;
        next();
    });
};

// ─────────────────────────────────────────────
//  INPUT VALIDATION RULES
// ─────────────────────────────────────────────
app.use('/api/user-profile-new', userProfileRoutes);
app.use('/api/user-profile', userProfileRoutes);
app.use('/api/user-password', userPasswordRoutes);

const loginValidation = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 50 }).withMessage('Username must be 3–50 characters')
        .matches(/^[a-zA-Z0-9._@-]+$/).withMessage('Username contains invalid characters'),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8, max: 128 }).withMessage('Password must be 8–128 characters')
];

// ─────────────────────────────────────────────
//  HELPER — Generic error response (never leak internals)
// ─────────────────────────────────────────────
function sendInternalError(res, requestId) {
    res.status(500).json({
        success   : false,
        message   : 'Internal server error',
        requestId                              // lets user quote this to support
    });
}

// ─────────────────────────────────────────────
//  ROUTE: POST /api/login
// ─────────────────────────────────────────────
app.post('/api/login', loginLimiter, loginValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, password } = req.body;
    let connection;

    try {
        connection = await oracledb.getConnection();

        // Fetch hash AND role — never select * (principle of least privilege)
        const query = `
            SELECT LOGIN_PW_HASH, USER_ROLE
            FROM   SA_USERPASSWORD
            WHERE  LOGIN_ID = :username
              AND  IS_ACTIVE = 1
        `;
        const result = await connection.execute(
            query,
            { username },                      // named bind — clear & safe
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // CONSTANT-TIME branch — same response time whether user exists or not
        // Prevents username enumeration via timing attack
        const dummyHash  = '$2b$12$eKNwQegeu1cGBhczps11ruktXf7GXO0n5g3Krex.FuRs985ndzkN6';
        const storedHash = result.rows.length > 0
                           ? result.rows[0].LOGIN_PW_HASH
                           : dummyHash;

        const match = await bcrypt.compare(password, storedHash);

        if (!match || result.rows.length === 0) {
            // Identical message for "wrong password" and "no user" — prevents enumeration
            logger.warn('Failed login attempt', {
                username  : username,
                ip        : req.ip,
                requestId : req.requestId
            });
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const userRole = result.rows[0].USER_ROLE;   // Role from DB, not hardcoded
        const jti      = crypto.randomUUID();         // Unique token ID (for revocation)

        // Access token — short lived
        const accessToken = jwt.sign(
            { sub: username, role: userRole, jti },
            process.env.JWT_SECRET,
            { expiresIn: '15m', issuer: 'erp-api', audience: 'erp-client' }
        );

        // Refresh token — longer lived, separate secret
        const refreshToken = jwt.sign(
            { sub: username, jti },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '8h', issuer: 'erp-api', audience: 'erp-client' }
        );

        logger.info('Successful login', {
            username  : username,
            role      : userRole,
            ip        : req.ip,
            requestId : req.requestId
        });

        res.json({
            success       : true,
            accessToken,
            refreshToken,
            expiresIn     : 900   // 15 minutes in seconds
        });

    } catch (err) {
        logger.error('Login route error', {
            message   : err.message,
            stack     : err.stack,
            requestId : req.requestId
        });
        sendInternalError(res, req.requestId);
    } finally {
        if (connection) {
            try { await connection.close(); }
            catch (e) { logger.error('Connection close error', { message: e.message }); }
        }
    }
});

// ─────────────────────────────────────────────
//  ROUTE: POST /api/logout  (token revocation)
// ─────────────────────────────────────────────
app.post('/api/logout', authenticateToken, (req, res) => {
    const { jti, exp } = req.user;
    blacklistToken(jti, exp);

    logger.info('User logged out', {
        username  : req.user.sub,
        jti,
        ip        : req.ip,
        requestId : req.requestId
    });

    res.json({ success: true, message: 'Logged out successfully' });
});

// ─────────────────────────────────────────────
//  ROUTE: GET /api/dashboard  (protected)
// ─────────────────────────────────────────────
app.get('/api/dashboard', authenticateToken, (req, res) => {
    logger.info('Dashboard accessed', {
        username  : req.user.sub,
        role      : req.user.role,
        ip        : req.ip,
        requestId : req.requestId
    });

    res.json({
        success : true,
        message : 'Welcome to Secure ERP Dashboard',
        user    : req.user.sub,
        role    : req.user.role
    });
});

// ─────────────────────────────────────────────
//  GLOBAL ERROR HANDLER  (catch anything missed)
// ─────────────────────────────────────────────
app.use((err, req, res, _next) => {
    logger.error('Unhandled error', {
        message   : err.message,
        stack     : err.stack,
        requestId : req.requestId
    });
    sendInternalError(res, req.requestId);
});

// ─────────────────────────────────────────────
//  START SERVER
// ─────────────────────────────────────────────
    (async () => {
        await initializePool();
        const PORT = parseInt(process.env.PORT, 10) || 3000;
        app.listen(PORT, () => {
        logger.info(`Server started`, { port: PORT });
    });
})();
