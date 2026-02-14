require("dotenv").config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Missing DATABASE_URL in environment.");
    process.exit(1);
  }

  let mysql;
  try {
    mysql = require("mysql2/promise");
  } catch (err) {
    console.error("mysql2 is not installed. Install it with: npm i mysql2");
    process.exit(1);
  }

  const connection = await mysql.createConnection(databaseUrl);
  const [rows] = await connection.query("SELECT 1 AS ok");
  await connection.end();

  console.log("SUCCESS: Connected to MySQL.");
  console.log(rows);
}

main().catch((err) => {
  console.error("FAILED to connect to MySQL:");
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});

