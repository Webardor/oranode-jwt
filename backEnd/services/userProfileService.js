const db = require("../config/db");

async function getAllUsers() {

    let connection;

    try {

        connection = await db.getConnection();

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
                outFormat: require("oracledb").OUT_FORMAT_OBJECT
            }
        );

        return result.rows;

    } finally {

        if (connection) {
            await connection.close();
        }

    }
}

module.exports = {
    getAllUsers
};