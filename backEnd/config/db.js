const oracledb = require("oracledb");

async function getConnection() {
  return await oracledb.getConnection();
}

module.exports = {
  getConnection
};