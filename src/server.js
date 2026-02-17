const path = require("path");

// cPanel/Passenger and other hosts may start the process with a cwd that is not the app root.
// Load `.env` from the project root first, then fall back to the default cwd lookup.
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), override: true });
require("dotenv").config({ override: true });

function normalizeCpanelMysqlUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) return value;

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return value;
  }

  if (parsed.protocol !== "mysql:") return value;
  if (parsed.username.includes("_")) return value;

  const dbName = parsed.pathname.replace(/^\/+/, "");
  const dbPrefix = dbName.includes("_") ? dbName.split("_")[0] : "";
  if (!dbPrefix) return value;

  parsed.username = `${dbPrefix}_${parsed.username}`;
  return parsed.toString();
}

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = normalizeCpanelMysqlUrl(process.env.DATABASE_URL);
}
const createApp = require("./app");

const app = createApp();

const port = parseInt(process.env.PORT, 10) || 3000;
const host = process.env.HOST || "0.0.0.0";

app.listen(port, host, () => {
  console.log(`Vivantara Express listening on http://${host}:${port}`);
});
