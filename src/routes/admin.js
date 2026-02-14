const express = require("express");

const { prisma } = require("../lib/prisma");
const { requireAdmin } = require("../middleware/auth");
const { sanitizeRichText } = require("../lib/sanitize");
const { normalizePageSlug, generateUniquePostSlug } = require("../lib/slugs");
const { syncDefaultStructure } = require("../lib/sync-default-structure");
const { WRITING_CATEGORIES } = require("../lib/writing");
const { DEFAULT_HOME_CONTENT, mergeHomeContent } = require("../lib/home-content");

const router = express.Router();

router.use("/admin", requireAdmin);

router.get("/admin", (req, res) => {
  res.render("admin/dashboard", { title: "Dashboard" });
});

router.get("/admin/settings", async (req, res, next) => {
  try {
    const heroSetting = await prisma.siteSetting.findUnique({ where: { key: "hero_statement" } });
    const pillarsSetting = await prisma.siteSetting.findUnique({ where: { key: "pillars_description" } });
    const bioSetting = await prisma.siteSetting.findUnique({ where: { key: "about_bio" } });
    const homeContentSetting = await prisma.siteSetting.findUnique({ where: { key: "home_content" } });

    const heroStatement = heroSetting?.value || "";
    const pillarsDescription = pillarsSetting?.value || "[]";
    const aboutBio = bioSetting?.value || "";

    let homeContent = JSON.stringify(DEFAULT_HOME_CONTENT, null, 2);
    if (homeContentSetting?.value) {
      try {
        const parsed = JSON.parse(homeContentSetting.value);
        const isLegacy =
          typeof parsed !== "object" ||
          parsed === null ||
          !parsed.hero ||
          !parsed.why_this_matters ||
          !parsed.how_we_work;

        homeContent = JSON.stringify(isLegacy ? DEFAULT_HOME_CONTENT : mergeHomeContent(parsed), null, 2);
      } catch {
        homeContent = JSON.stringify(DEFAULT_HOME_CONTENT, null, 2);
      }
    }

    res.render("admin/settings", {
      title: "Global Settings",
      saved: req.query.saved === "1",
      error: typeof req.query.error === "string" ? req.query.error : "",
      heroStatement,
      pillarsDescription,
      aboutBio,
      homeContent,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/admin/settings", async (req, res, next) => {
  try {
    const heroStatement = String(req.body.hero_statement || "");
    const pillarsJson = String(req.body.pillars_description || "[]");
    const aboutBio = String(req.body.about_bio || "");
    const homeContentJson = String(req.body.home_content || "");

    try {
      JSON.parse(pillarsJson);
    } catch {
      return res.redirect("/admin/settings?error=" + encodeURIComponent("Invalid JSON for pillars_description"));
    }

    if (homeContentJson) {
      try {
        JSON.parse(homeContentJson);
      } catch {
        return res.redirect("/admin/settings?error=" + encodeURIComponent("Invalid JSON for home_content"));
      }
    }

    await prisma.siteSetting.upsert({
      where: { key: "hero_statement" },
      update: { value: heroStatement },
      create: { key: "hero_statement", value: heroStatement },
    });

    await prisma.siteSetting.upsert({
      where: { key: "pillars_description" },
      update: { value: pillarsJson },
      create: { key: "pillars_description", value: pillarsJson },
    });

    await prisma.siteSetting.upsert({
      where: { key: "about_bio" },
      update: { value: aboutBio },
      create: { key: "about_bio", value: aboutBio },
    });

    await prisma.siteSetting.upsert({
      where: { key: "home_content" },
      update: { value: homeContentJson },
      create: { key: "home_content", value: homeContentJson },
    });

    res.redirect("/admin/settings?saved=1");
  } catch (err) {
    next(err);
  }
});

router.get("/admin/menu", async (req, res, next) => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { parentId: null },
      include: { children: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    });

    res.render("admin/menu", {
      title: "Menu Management",
      saved: req.query.saved === "1",
      menuItems,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/admin/menu/sync", async (req, res, next) => {
  try {
    await syncDefaultStructure(prisma);
    res.redirect("/admin/menu?saved=1");
  } catch (err) {
    next(err);
  }
});

router.post("/admin/menu/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const title = String(req.body.title || "").trim();
    if (title) {
      await prisma.menuItem.update({ where: { id }, data: { title } });
    }
    res.redirect("/admin/menu?saved=1");
  } catch (err) {
    next(err);
  }
});

router.get("/admin/pages", async (req, res, next) => {
  try {
    const pages = await prisma.page.findMany({ orderBy: { slug: "asc" } });
    res.render("admin/pages-index", { title: "Pages", pages, saved: req.query.saved === "1" });
  } catch (err) {
    next(err);
  }
});

router.get("/admin/pages/new", async (req, res) => {
  res.render("admin/pages-new", { title: "Create Page", error: "" });
});

router.post("/admin/pages/new", async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const rawSlug = String(req.body.slug || "");
    const content = sanitizeRichText(String(req.body.content || ""));

    if (!title) {
      return res.render("admin/pages-new", { title: "Create Page", error: "Title is required." });
    }

    const slug = normalizePageSlug(rawSlug);
    if (!slug) {
      return res.render("admin/pages-new", { title: "Create Page", error: "Valid slug is required." });
    }

    const existing = await prisma.page.findUnique({ where: { slug } });
    if (existing) {
      return res.render("admin/pages-new", { title: "Create Page", error: "A page with this slug already exists." });
    }

    await prisma.page.create({
      data: {
        title,
        slug,
        content,
      },
    });

    res.redirect("/admin/pages?saved=1");
  } catch (err) {
    next(err);
  }
});

router.get("/admin/pages/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const page = await prisma.page.findUnique({ where: { id } });
    if (!page) {
      return res.status(404).render("admin/not-found", { title: "Not Found" });
    }

    res.render("admin/pages-edit", { title: "Edit Page", page, saved: req.query.saved === "1" });
  } catch (err) {
    next(err);
  }
});

router.post("/admin/pages/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const title = String(req.body.title || "").trim();
    const content = sanitizeRichText(String(req.body.content || ""));

    await prisma.page.update({
      where: { id },
      data: { title, content },
    });

    res.redirect(`/admin/pages/${encodeURIComponent(id)}?saved=1`);
  } catch (err) {
    next(err);
  }
});

router.get("/admin/writing", async (req, res, next) => {
  try {
    const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });
    res.render("admin/writing-index", { title: "Articles", posts, saved: req.query.saved === "1" });
  } catch (err) {
    next(err);
  }
});

router.get("/admin/writing/new", async (req, res) => {
  res.render("admin/writing-form", {
    title: "New Post",
    categories: WRITING_CATEGORIES,
    post: null,
    error: "",
  });
});

router.post("/admin/writing/new", async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const category = String(req.body.category || "").trim();
    const content = sanitizeRichText(String(req.body.content || ""));
    const published = req.body.published === "on";

    if (!title || !category) {
      return res.render("admin/writing-form", {
        title: "New Post",
        categories: WRITING_CATEGORIES,
        post: null,
        error: "Title and category are required.",
      });
    }

    const slug = await generateUniquePostSlug(prisma, title);

    await prisma.post.create({
      data: { title, slug, category, content, published },
    });

    res.redirect("/admin/writing?saved=1");
  } catch (err) {
    next(err);
  }
});

router.get("/admin/writing/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).render("admin/not-found", { title: "Not Found" });
    }

    res.render("admin/writing-form", {
      title: "Edit Post",
      categories: WRITING_CATEGORIES,
      post,
      error: "",
      saved: req.query.saved === "1",
    });
  } catch (err) {
    next(err);
  }
});

router.post("/admin/writing/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const title = String(req.body.title || "").trim();
    const category = String(req.body.category || "").trim();
    const content = sanitizeRichText(String(req.body.content || ""));
    const published = req.body.published === "on";

    await prisma.post.update({
      where: { id },
      data: { title, category, content, published },
    });

    res.redirect(`/admin/writing/${encodeURIComponent(id)}?saved=1`);
  } catch (err) {
    next(err);
  }
});

router.post("/admin/writing/:id/delete", async (req, res, next) => {
  try {
    const id = String(req.params.id);
    await prisma.post.delete({ where: { id } });
    res.redirect("/admin/writing?saved=1");
  } catch (err) {
    next(err);
  }
});

router.get("/admin/enquiries", async (req, res, next) => {
  try {
    const submissions = await prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" } });
    res.render("admin/enquiries", {
      title: "Enquiries",
      submissions,
      saved: req.query.saved === "1",
    });
  } catch (err) {
    next(err);
  }
});

router.post("/admin/enquiries/:id/read", async (req, res, next) => {
  try {
    const id = String(req.params.id);
    await prisma.contactSubmission.update({ where: { id }, data: { read: true } });
    res.redirect("/admin/enquiries?saved=1");
  } catch (err) {
    next(err);
  }
});

module.exports = router;

