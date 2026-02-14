const express = require("express");
const bcrypt = require("bcryptjs");

const { prisma, withPrismaFallback } = require("../lib/prisma");

const router = express.Router();

router.get("/auth/signin", (req, res) => {
  if (req.session?.user?.email) {
    return res.redirect("/admin");
  }

  const returnTo = typeof req.query.returnTo === "string" ? req.query.returnTo : "/admin";
  const error = typeof req.query.error === "string" ? req.query.error : "";

  res.render("auth/signin", {
    title: "Sign In",
    returnTo,
    error: error ? "Invalid credentials." : "",
  });
});

router.post("/auth/signin", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const returnTo = String(req.body.returnTo || "/admin");

    if (!email || !password) {
      return res.redirect(`/auth/signin?error=1&returnTo=${encodeURIComponent(returnTo)}`);
    }

    const user = await withPrismaFallback(
      () => prisma.user.findUnique({ where: { email } }),
      null,
      "auth.signin.userLookup"
    );

    if (!user) {
      return res.redirect(`/auth/signin?error=1&returnTo=${encodeURIComponent(returnTo)}`);
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.redirect(`/auth/signin?error=1&returnTo=${encodeURIComponent(returnTo)}`);
    }

    req.session.user = { id: user.id, email: user.email, name: user.name || "Admin" };
    res.redirect(returnTo.startsWith("/") ? returnTo : "/admin");
  } catch (err) {
    next(err);
  }
});

router.get("/auth/signout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

// Backwards-compatible NextAuth-like routes.
router.get("/api/auth/signin", (req, res) => {
  res.redirect("/auth/signin");
});

router.get("/api/auth/signout", (req, res) => {
  res.redirect("/auth/signout");
});

module.exports = router;
