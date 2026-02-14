require("dotenv").config();
const createApp = require("./app");

const app = createApp();

const port = parseInt(process.env.PORT, 10) || 3000;
const host = process.env.HOST || "0.0.0.0";

app.listen(port, host, () => {
  console.log(`Vivantara Express listening on http://${host}:${port}`);
});
