const path = require("path");

// cPanel/Passenger and other hosts may start the process with a cwd that is not the app root.
// Load `.env` from the project root first, then fall back to the default cwd lookup.
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config();
const createApp = require("./app");

const app = createApp();

const port = parseInt(process.env.PORT, 10) || 3000;
const host = process.env.HOST || "0.0.0.0";

app.listen(port, host, () => {
  console.log(`Vivantara Express listening on http://${host}:${port}`);
});
