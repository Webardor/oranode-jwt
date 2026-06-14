const bcrypt = require("bcrypt");
const oracledb = require("oracledb");
const { validationResult } = require("express-validator");

function hasValidationErrors(req, res) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            errors: errors.array()
        });
        return true;
    }

    return false;
}

function maskHash(hash) {
    if (!hash) {
        return "";
    }

    return `${hash.slice(0, 7)}...${hash.slice(-6)}`;
}

function sendServerError(res, err) {
    console.error(err);

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
}

async function closeConnection(connection) {
    if (!connection) {
        return;
    }

    try {
        await connection.close();
    } catch (err) {
        console.error("Oracle connection close error:", err.message);
    }
}

const getAllUserPasswords = async (_req, res) => {
    let connection;

    try {
        connection = await oracledb.getConnection();

        const result = await connection.execute(
            `
            SELECT
                p.USER_ID,
                u.USER_NAME,
                u.LOGIN_ID,
                p.PASSWORD_HASH,
                p.PASSWORD_CREATED,
                p.PASSWORD_UPDATED,
                p.IS_ACTIVE
            FROM APP_USERPASSWORD p
            LEFT JOIN APP_USERPROFILE u
                ON u.USER_ID = p.USER_ID
            ORDER BY p.USER_ID
            `,
            [],
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        const data = result.rows.map((row) => ({
            USER_ID: row.USER_ID,
            USER_NAME: row.USER_NAME,
            LOGIN_ID: row.LOGIN_ID,
            PASSWORD_HASH_MASKED: maskHash(row.PASSWORD_HASH),
            PASSWORD_CREATED: row.PASSWORD_CREATED,
            PASSWORD_UPDATED: row.PASSWORD_UPDATED,
            IS_ACTIVE: row.IS_ACTIVE
        }));

        res.json({
            success: true,
            data
        });
    } catch (err) {
        sendServerError(res, err);
    } finally {
        await closeConnection(connection);
    }
};

const updateUserPassword = async (req, res) => {
    if (hasValidationErrors(req, res)) {
        return;
    }

    let connection;

    try {
        const { userId } = req.params;
        const { isActive, newPassword } = req.body;
        const binds = {
            USER_ID: Number(userId),
            IS_ACTIVE: Number(isActive)
        };

        let passwordClause = "";

        if (newPassword) {
            binds.PASSWORD_HASH = await bcrypt.hash(newPassword, 12);
            passwordClause = ", PASSWORD_HASH = :PASSWORD_HASH";
        }

        connection = await oracledb.getConnection();

        const result = await connection.execute(
            `
            UPDATE APP_USERPASSWORD
            SET
                IS_ACTIVE = :IS_ACTIVE,
                PASSWORD_UPDATED = SYSDATE
                ${passwordClause}
            WHERE USER_ID = :USER_ID
            `,
            binds
        );

        if (result.rowsAffected === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Password record not found"
            });
        }

        await connection.commit();

        return res.json({
            success: true,
            message: "Password record updated successfully"
        });
    } catch (err) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackErr) {
                console.error("Oracle rollback error:", rollbackErr.message);
            }
        }

        return sendServerError(res, err);
    } finally {
        await closeConnection(connection);
    }
};

module.exports = {
    getAllUserPasswords,
    updateUserPassword
};
