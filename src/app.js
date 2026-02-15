const path = require("path");

const express = require("express");
const cookieSession = require("cookie-session");

const { loadMenu } = require("./middleware/load-menu");
const seoRoutes = require("./routes/seo");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const publicRoutes = require("./routes/public");

function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "views"));

  app.disable("x-powered-by");

  app.use(express.urlencoded({ extended: true, limit: "5mb" }));

  const sessionSecret =
    process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

  if (process.env.NODE_ENV === "production" && !sessionSecret) {
    throw new Error("Missing SESSION_SECRET (or NEXTAUTH_SECRET / AUTH_SECRET) in production.");
  }

  app.use(
    cookieSession({
      name: "vivantara_session",
      keys: [sessionSecret || "dev-insecure-secret"],
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    })
  );

  // Static assets live in `milesweb-express/public` (self-contained for MilesWeb deployments).
  app.use(express.static(path.join(__dirname, "..", "public")));

  // Static files win. If `public/sitemap.xml` or `public/robots.txt` are removed,
  // fall back to the dynamic generator.
  app.use(seoRoutes);

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
