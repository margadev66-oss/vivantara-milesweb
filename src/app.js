const path = require("path");

const express = require("express");
const cookieSession = require("cookie-session");

const { loadMenu } = require("./middleware/load-menu");
const seoRoutes = require("./routes/seo");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const publicRoutes = require("./routes/public");

function parseBooleanEnv(value) {
  if (value == null) return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no" || normalized === "off") return false;
  return undefined;
}

function parseTrustProxy(value) {
  if (value == null || String(value).trim() === "") return 1;

  const normalized = String(value).trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;

  const asNumber = Number(normalized);
  if (Number.isInteger(asNumber) && asNumber >= 0) return asNumber;

  return value;
}

function createApp() {
  const app = express();

  app.set("trust proxy", parseTrustProxy(process.env.TRUST_PROXY));
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "views"));

  app.disable("x-powered-by");

  app.use(express.urlencoded({ extended: true, limit: "5mb" }));

  const sessionSecret =
    process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

  if (process.env.NODE_ENV === "production" && !sessionSecret) {
    throw new Error("Missing SESSION_SECRET (or NEXTAUTH_SECRET / AUTH_SECRET) in production.");
  }

  const cookieSecure = parseBooleanEnv(process.env.SESSION_COOKIE_SECURE);
  const sessionOptions = {
    name: "vivantara_session",
    keys: [sessionSecret || "dev-insecure-secret"],
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
    httpOnly: true,
  };

  // If unset, cookie-session auto-detects HTTPS from the request/proxy.
  // This avoids silent auth failures on hosts that offload TLS.
  if (cookieSecure !== undefined) {
    sessionOptions.secure = cookieSecure;
  }

  app.use(
    cookieSession(sessionOptions)
  );

  // Serve dynamic SEO endpoints first so they work even if a host leaves behind old static files.
  // (On cPanel/Passenger deployments, stale `public/sitemap.xml` can otherwise override the route.)
  app.use(seoRoutes);

  // Static assets live in `public` (self-contained for MilesWeb deployments).
  app.use(express.static(path.join(__dirname, "..", "public")));

  app.use((req, res, next) => {
    res.locals.sessionUser = req.session?.user || null;
    res.locals.currentPath = req.path;
    next();
  });

  // Public menu only matters for HTML routes (static assets already handled above).
  app.use(loadMenu);

  app.use(authRoutes);
  app.use(adminRoutes);
  app.use(publicRoutes);

  // 404
  app.use((req, res) => {
    res.status(404).render("public/not-found", { title: "Not Found" });
  });

  // Error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).render("public/error", {
      title: "Server Error",
      message: process.env.NODE_ENV === "production" ? "Something went wrong." : String(err?.stack || err),
    });
  });

  return app;
}

module.exports = createApp;
