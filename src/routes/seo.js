const express = require("express");

const { prisma, withPrismaFallback } = require("../lib/prisma");
const { SITE_NAVIGATION } = require("../lib/site-structure");

const router = express.Router();

function normalizeConfiguredBaseUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const withScheme = /^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(withScheme);
    // Keep any configured base path (supports hosting under a subdirectory).
    const pathname = url.pathname.replace(/\/+$/, "");
    return `${url.origin}${pathname}`;
  } catch {
    return null;
  }
}

function getBaseUrl(req) {
  const configured =
    normalizeConfiguredBaseUrl(process.env.SITE_URL) ||
    normalizeConfiguredBaseUrl(process.env.PUBLIC_BASE_URL) ||
    normalizeConfiguredBaseUrl(process.env.BASE_URL);

  if (configured) return configured;

  const forwardedProto = String(req.headers["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim();

  const proto = forwardedProto || req.protocol || "https";
  const host = req.get("host");

  return host ? `${proto}://${host}` : "http://localhost";
}

function isInternalPath(url) {
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//");
}

function isDisallowedPath(pathname) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/api" ||
    pathname.startsWith("/api/")
  );
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toUrl(baseUrl, pathname) {
  try {
    // Ensure any configured base path is respected.
    return new URL(pathname.replace(/^\//, ""), `${baseUrl.replace(/\/+$/, "")}/`).toString();
  } catch {
    return null;
  }
}

function buildSitemapXml(entries) {
  const urls = entries
    .filter(Boolean)
    .map((entry) => {
      const lastmod = entry.lastmod instanceof Date ? entry.lastmod.toISOString() : null;
      return [
        "  <url>",
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : null,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n` +
    `</urlset>\n`
  );
}

function fallbackMenuUrls() {
  const urls = [];

  for (const item of SITE_NAVIGATION) {
    if (isInternalPath(item.url)) urls.push(item.url);
    if (!item.children || !item.basePath) continue;
    for (const child of item.children) {
      urls.push(`/${item.basePath}/${child.slug}`);
    }
  }

  return urls;
}

function normalizeSlugToPath(slug) {
  const clean = String(slug || "").replace(/^\/+/, "").replace(/\/+$/, "");
  return clean ? `/${clean}` : null;
}

function isReachablePageSlug(slug) {
  const clean = String(slug || "").replace(/^\/+/, "").replace(/\/+$/, "");
  if (!clean) return false;

  if (clean === "contact" || clean === "writing" || clean === "about") return true;
  if (clean === "engage" || clean === "knowledge-assets" || clean === "ongoing-research" || clean === "resources")
    return true;

  return (
    clean.startsWith("engage/") ||
    clean.startsWith("knowledge-assets/") ||
    clean.startsWith("ongoing-research/") ||
    clean.startsWith("resources/") ||
    clean.startsWith("about/") ||
    clean.startsWith("research/") // legacy (maps to /ongoing-research/:slug)
  );
}

function canonicalPathForPageSlug(slug) {
  const clean = String(slug || "").replace(/^\/+/, "").replace(/\/+$/, "");
  if (!clean) return null;

  if (clean.startsWith("research/")) {
    return normalizeSlugToPath(clean.replace(/^research\//, "ongoing-research/"));
  }

  return normalizeSlugToPath(clean);
}

router.get("/robots.txt", (req, res) => {
  const baseUrl = getBaseUrl(req);
  const sitemapUrl = toUrl(baseUrl, "/sitemap.xml");

  res.type("text/plain; charset=utf-8");
  res.set("Cache-Control", "public, max-age=300");

  res.send(
    [
      "User-agent: *",
      "Disallow: /admin",
      "Disallow: /auth",
      "Disallow: /api",
      sitemapUrl ? `Sitemap: ${sitemapUrl}` : "Sitemap: /sitemap.xml",
      "",
    ].join("\n")
  );
});

router.get("/sitemap.xml", async (req, res, next) => {
  try {
    const baseUrl = getBaseUrl(req);

    const staticPaths = [
      "/home",
      "/contact",
      "/writing",
      "/engage",
      "/engage/services-overview",
      "/engage/how-it-works",
      "/engage/organisations",
      "/knowledge-assets",
      "/knowledge-assets/frameworks",
      "/knowledge-assets/case-studies",
      "/knowledge-assets/papers",
      "/ongoing-research",
      "/ongoing-research/introduction-to-research",
      "/ongoing-research/literature-review-summary",
      "/ongoing-research/research-design-and-methodology",
      "/ongoing-research/practical-implications",
      "/ongoing-research/limitations-and-future-directions",
      "/resources",
      "/resources/articles",
      "/resources/downloads",
      "/resources/envisions",
      "/resources/faqs",
      "/about",
    ];

    const menuUrls = await withPrismaFallback(
      async () => {
        const items = await prisma.menuItem.findMany({
          where: { parentId: null },
          select: { url: true, children: { select: { url: true } } },
        });

        const urls = [];
        for (const item of items) {
          if (isInternalPath(item.url)) urls.push(item.url);
          for (const child of item.children || []) {
            if (isInternalPath(child.url)) urls.push(child.url);
          }
        }
        return urls;
      },
      fallbackMenuUrls(),
      "seo.sitemap.menu"
    );

    const pages = await withPrismaFallback(
      () => prisma.page.findMany({ select: { slug: true, updatedAt: true } }),
      [],
      "seo.sitemap.pages"
    );

    const posts = await withPrismaFallback(
      () =>
        prisma.post.findMany({
          where: { published: true },
          select: { slug: true, updatedAt: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        }),
      [],
      "seo.sitemap.posts"
    );

    const entries = [];
    const seen = new Set();

    function addEntry(pathname, lastmod) {
      if (!pathname || typeof pathname !== "string") return;
      if (!pathname.startsWith("/")) return;
      if (isDisallowedPath(pathname)) return;

      const loc = toUrl(baseUrl, pathname);
      if (!loc) return;

      if (seen.has(loc)) return;
      seen.add(loc);

      entries.push({ loc, lastmod: lastmod instanceof Date ? lastmod : undefined });
    }

    for (const pathname of staticPaths) addEntry(pathname);
    for (const pathname of menuUrls) addEntry(pathname);

    for (const page of pages) {
      if (!isReachablePageSlug(page.slug)) continue;
      addEntry(canonicalPathForPageSlug(page.slug), page.updatedAt);
    }

    for (const post of posts) {
      const pathname = normalizeSlugToPath(`writing/${post.slug}`);
      addEntry(pathname, post.updatedAt || post.createdAt);
    }

    res.type("application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=300");
    res.send(buildSitemapXml(entries));
  } catch (err) {
    next(err);
  }
});

module.exports = router;

