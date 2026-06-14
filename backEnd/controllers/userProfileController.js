const oracledb = require("oracledb");
const { validationResult } = require("express-validator");

function sendValidationErrors(req, res) {
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

const getAllUsers = async (_req, res) => {
    let connection;

    try {
        connection = await oracledb.getConnection();

        const result = await connection.execute(
            `
            SELECT
                USER_ID,
                USER_NAME,
                LOGIN_ID,
                EMAIL_ADDRESS,
                MOBILE_NO,
                USER_STATUS,
                CREATED_ON,
                CREATED_BY
            FROM APP_USERPROFILE
            ORDER BY USER_ID
            `,
            [],
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        sendServerError(res, err);
    } finally {
        await closeConnection(connection);
    }
};

const createUser = async (req, res) => {
    if (sendValidationErrors(req, res)) {
        return;
    }

    let connection;

    try {
        const {
            userName,
            loginId,
            emailAddress,
            mobileNo,
            userStatus
        } = req.body;

        connection = await oracledb.getConnection();

        await connection.execute("LOCK TABLE APP_USERPROFILE IN EXCLUSIVE MODE");

        const idResult = await connection.execute(
            `
            SELECT NVL(MAX(USER_ID), 0) + 1 AS NEW_ID
            FROM APP_USERPROFILE
            `,
            [],
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        const newUserId = idResult.rows[0].NEW_ID;

        await connection.execute(
            `
            INSERT INTO APP_USERPROFILE
            (
                USER_ID,
                USER_NAME,
                LOGIN_ID,
                EMAIL_ADDRESS,
                MOBILE_NO,
                USER_STATUS,
                CREATED_ON,
                CREATED_BY
            )
            VALUES
            (
                :USER_ID,
                :USER_NAME,
                :LOGIN_ID,
                :EMAIL_ADDRESS,
                :MOBILE_NO,
                :USER_STATUS,
                SYSDATE,
                1
            )
            `,
            {
                USER_ID: newUserId,
                USER_NAME: userName,
                LOGIN_ID: loginId,
                EMAIL_ADDRESS: emailAddress,
                MOBILE_NO: mobileNo,
                USER_STATUS: userStatus
            }
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "User Created Successfully",
            userId: newUserId
        });
    } catch (err) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackErr) {
                console.error("Oracle rollback error:", rollbackErr.message);
            }
        }

        sendServerError(res, err);
    } finally {
        await closeConnection(connection);
    }
};

const updateUser = async (req, res) => {
    if (sendValidationErrors(req, res)) {
        return;
    }

    let connection;

    try {
        const { userId } = req.params;
        const {
            userName,
            loginId,
            emailAddress,
            mobileNo,
            userStatus
        } = req.body;

        connection = await oracledb.getConnection();

        const result = await connection.execute(
            `
            UPDATE APP_USERPROFILE
            SET
                USER_NAME = :USER_NAME,
                LOGIN_ID = :LOGIN_ID,
                EMAIL_ADDRESS = :EMAIL_ADDRESS,
                MOBILE_NO = :MOBILE_NO,
                USER_STATUS = :USER_STATUS
            WHERE USER_ID = :USER_ID
            `,
            {
                USER_ID: Number(userId),
                USER_NAME: userName,
                LOGIN_ID: loginId,
                EMAIL_ADDRESS: emailAddress,
                MOBILE_NO: mobileNo,
                USER_STATUS: userStatus
            }
        );

        if (result.rowsAffected === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        await connection.commit();

        return res.json({
            success: true,
            message: "User Updated Successfully"
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

const deleteUser = async (req, res) => {
    if (sendValidationErrors(req, res)) {
        return;
    }

    let connection;

    try {
        const { userId } = req.params;

        connection = await oracledb.getConnection();

        const result = await connection.execute(
            `
            DELETE FROM APP_USERPROFILE
            WHERE USER_ID = :USER_ID
            `,
            {
                USER_ID: Number(userId)
            }
        );

        if (result.rowsAffected === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        await connection.commit();

        return res.json({
            success: true,
            message: "User Deleted Successfully"
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
    getAllUsers,
    createUser,
    updateUser,
    deleteUser
};
