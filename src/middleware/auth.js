function requireAdmin(req, res, next) {
  if (req.session?.user?.email) {
    return next();
  }

  const returnTo = req.originalUrl || "/admin";
  return res.redirect(`/auth/signin?returnTo=${encodeURIComponent(returnTo)}`);
}

module.exports = { requireAdmin };

