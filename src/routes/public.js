const express = require("express");

const { prisma, withPrismaFallback } = require("../lib/prisma");
const { getEditablePage } = require("../lib/editable-pages");
const { DEFAULT_HOME_CONTENT, mergeHomeContent } = require("../lib/home-content");

const router = express.Router();

router.get("/", (req, res) => res.redirect("/home"));

router.get("/connect", (req, res) => res.redirect("/contact"));
router.get("/ip", (req, res) => res.redirect("/knowledge-assets"));
router.get("/ip/:slug", (req, res) => res.redirect("/knowledge-assets"));
router.get("/knowledge", (req, res) => res.redirect("/knowledge-assets"));
router.get("/knowledge/:slug", (req, res) => res.redirect(`/knowledge-assets/${encodeURIComponent(req.params.slug)}`));
router.get("/research", (req, res) => res.redirect("/ongoing-research"));
router.get("/research/:slug", (req, res) => res.redirect(`/ongoing-research/${encodeURIComponent(req.params.slug)}`));
router.get("/vivartana", (req, res) => res.redirect("/engage"));
router.get("/vivartana/:slug", (req, res) => {
  const slug = String(req.params.slug || "");
  const slugMap = {
    individuals: "individuals",
    organisations: "organisations",
    teams: "organisations",
    services: "services-overview",
    "how-vivartana-works": "how-it-works",
  };
  const mapped = slugMap[slug];
  res.redirect(mapped ? `/engage/${mapped}` : "/engage");
});

router.get("/home", async (req, res, next) => {
  try {
    const homeContentSetting = await withPrismaFallback(
      () => prisma.siteSetting.findUnique({ where: { key: "home_content" } }),
      null,
      "home.homeContentSetting"
    );

    let homeContent = DEFAULT_HOME_CONTENT;
    if (homeContentSetting?.value) {
      try {
        const parsed = JSON.parse(homeContentSetting.value);
        const isLegacy =
          typeof parsed !== "object" ||
          parsed === null ||
          !parsed.hero ||
          !parsed.why_this_matters ||
          !parsed.how_we_work;

        homeContent = isLegacy ? DEFAULT_HOME_CONTENT : mergeHomeContent(parsed);
      } catch {
        homeContent = DEFAULT_HOME_CONTENT;
      }
    }

    res.render("public/home", { title: "Home", homeContent });
  } catch (err) {
    next(err);
  }
});

router.get("/contact", async (req, res, next) => {
  try {
    const editablePage = await getEditablePage("contact");
    res.render("public/contact", {
      title: "Contact",
      editablePage,
      sent: req.query.sent === "1",
    });
  } catch (err) {
    next(err);
  }
});

router.post("/contact", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim();
    const subject = String(req.body.subject || "").trim();
    const message = String(req.body.message || "").trim();

    await prisma.contactSubmission.create({
      data: { name, email, subject, message },
    });

    res.redirect("/contact?sent=1");
  } catch (err) {
    next(err);
  }
});

router.get("/writing", async (req, res, next) => {
  try {
    const category = typeof req.query.category === "string" ? req.query.category : "";
    const editablePage = await getEditablePage("writing");

    const where = {
      published: true,
      ...(category ? { category } : {}),
    };

    const posts = await withPrismaFallback(
      () => prisma.post.findMany({ where, orderBy: { createdAt: "desc" } }),
      [],
      "writing.posts"
    );

    const categories = await withPrismaFallback(
      () =>
        prisma.post.findMany({
          where: { published: true },
          select: { category: true },
          distinct: ["category"],
        }),
      [],
      "writing.categories"
    );

    res.render("public/writing-index", {
      title: "Articles",
      editablePage,
      posts,
      categories,
      selectedCategory: category,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/writing/:slug", async (req, res, next) => {
  try {
    const slug = String(req.params.slug || "");
    const post = await withPrismaFallback(
      () => prisma.post.findFirst({ where: { slug, published: true } }),
      null,
      `writing.slug:${slug}`
    );

    if (!post) {
      return res.status(404).render("public/not-found", { title: "Not Found" });
    }

    res.render("public/writing-post", { title: post.title, post });
  } catch (err) {
    next(err);
  }
});

router.get("/section/:slug", async (req, res, next) => {
  try {
    const slug = String(req.params.slug || "");

    const menuItem = await withPrismaFallback(
      () =>
        prisma.menuItem.findFirst({
          where: {
            url: { contains: slug },
          },
        }),
      null,
      `section.menuItem:${slug}`
    );

    const title =
      menuItem?.title ||
      slug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

    const posts = await withPrismaFallback(
      () =>
        prisma.post.findMany({
          where: { published: true, category: title },
          orderBy: { createdAt: "desc" },
        }),
      [],
      `section.posts:${slug}`
    );

    res.render("public/section", { title, posts });
  } catch (err) {
    next(err);
  }
});

router.get("/engage", async (req, res, next) => {
  try {
    const editablePage = await getEditablePage("engage");
    const menu = await withPrismaFallback(
      () =>
        prisma.menuItem.findFirst({
          where: { title: "Engage with Us" },
          include: { children: { orderBy: { order: "asc" } } },
        }),
      null,
      "engage.index.menu"
    );

    res.render("public/engage-index", { title: "Engage", editablePage, menu });
  } catch (err) {
    next(err);
  }
});

router.get("/engage/services-overview", async (req, res, next) => {
  try {
    const editablePage = await getEditablePage("engage/services-overview");
    res.render("public/engage-services-overview", { title: "Services Overview", editablePage });
  } catch (err) {
    next(err);
  }
});

router.get("/engage/how-it-works", async (req, res, next) => {
  try {
    const editablePage = await getEditablePage("engage/how-it-works");
    res.render("public/engage-how-it-works", { title: "How It Works", editablePage });
  } catch (err) {
    next(err);
  }
});

router.get("/engage/organisations", async (req, res, next) => {
  try {
    const editablePage = await getEditablePage("engage/organisations");
    res.render("public/engage-organisations", { title: "Organisations", editablePage });
  } catch (err) {
    next(err);
  }
});

router.get("/engage/:slug", async (req, res, next) => {
  try {
    const slug = String(req.params.slug || "");
    const legacySlugMap = { services: "services-overview" };
    if (legacySlugMap[slug]) {
      return res.redirect(`/engage/${legacySlugMap[slug]}`);
    }

    const fullSlug = `engage/${slug}`;
    const page = await withPrismaFallback(
      () => prisma.page.findUnique({ where: { slug: fullSlug } }),
      null,
      `engage.slug:${fullSlug}`
    );

    res.render("public/generic-page", {
      title: page?.title || slug.replace(/-/g, " "),
      page,
      fullSlug,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/knowledge-assets", async (req, res, next) => {
  try {
    const editablePage = await getEditablePage("knowledge-assets");
    const menu = await withPrismaFallback(
      () =>
        prisma.menuItem.findFirst({
          where: { title: "Knowledge Assets" },
          include: { children: { orderBy: { order: "asc" } } },
        }),
      null,
      "knowledge-assets.index.menu"
    );

    res.render("public/knowledge-assets-index", { title: "Knowledge Assets", editablePage, menu });
  } catch (err) {
    next(err);
  }
});

router.get("/knowledge-assets/frameworks", async (req, res, next) => {
  try {
    const editablePage = await getEditablePage("knowledge-assets/frameworks");
    if (editablePage) {
      return res.render("public/editable-page", { title: editablePage.title, page: editablePage });
    }
    res.render("public/knowledge-assets-frameworks", { title: "Frameworks" });
  } catch (err) {
    next(err);
  }
});

router.get("/knowledge-assets/case-studies", async (req, res, next) => {
  try {
    const editablePage = await getEditablePage("knowledge-assets/case-studies");
    if (editablePage) {
      return res.render("public/editable-page", { title: editablePage.title, page: editablePage });
    }
    res.render("public/knowledge-assets-case-studies", { title: "Case Studies" });
  } catch (err) {
    next(err);
  }
});

router.get("/knowledge-assets/papers", async (req, res, next) => {
  try {
    const editablePage = await getEditablePage("knowledge-assets/papers");
    if (editablePage) {
      return res.render("public/editable-page", { title: editablePage.title, page: editablePage });
    }
    res.render("public/knowledge-assets-papers", { title: "Papers" });
  } catch (err) {
    next(err);
  }
});

router.get("/knowledge-assets/:slug", async (req, res, next) => {
  try {
    const slug = String(req.params.slug || "");
    const fullSlug = `knowledge-assets/${slug}`;
    const page = await withPrismaFallback(
      () => prisma.page.findUnique({ where: { slug: fullSlug } }),
      null,
      `knowledge-assets.slug:${fullSlug}`
    );

    res.render("public/generic-page", {
      title: page?.title || slug.replace(/-/g, " "),
      page,
      fullSlug,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/ongoing-research", async (req, res, next) => {
  try {
    const editablePage = await getEditablePage("ongoing-research");
    const menu = await withPrismaFallback(
      () =>
        prisma.menuItem.findFirst({
          where: { title: "Ongoing Research" },
          include: { children: { orderBy: { order: "asc" } } },
        }),
      null,
      "ongoing-research.index.menu"
    );

    res.render("public/ongoing-research-index", { title: "Ongoing Research", editablePage, menu });
  } catch (err) {
    next(err);
  }
});

router.get("/ongoing-research/introduction-to-research", async (req, res, next) => {
  try {
    const editablePage = await getEditablePage("ongoing-research/introduction-to-research");
    if (editablePage) return res.render("public/editable-page", { title: editablePage.title, page: editablePage });
    res.render("public/ongoing-research-introduction", { title: "Introduction" });
  } catch (err) {
    next(err);
  }
});

router.get("/ongoing-research/literature-review-summary", async (req, res, next) => {
  try {
    const editablePage = await getEditablePage("ongoing-research/literature-review-summary");
    if (editablePage) return res.render("public/editable-page", { title: editablePage.title, page: editablePage });
    res.render("public/ongoing-research-literature", { title: "Literature Review Summary" });
  } catch (err) {
    next(err);
  }
});

router.get("/ongoing-research/research-design-and-methodology", async (req, res, next) => {
  try {
    const editablePage = await getEditablePage("ongoing-research/research-design-and-methodology");
    if (editablePage) return res.render("public/editable-page", { title: editablePage.title, page: editablePage });
    res.render("public/ongoing-research-methodology", { title: "Research Design and Methodology" });
  } catch (err) {
    next(err);
  }
});

router.get("/ongoing-research/practical-implications", async (req, res, next) => {
  try {
    const editablePage = await getEditablePage("ongoing-research/practical-implications");
    if (editablePage) return res.render("public/editable-page", { title: editablePage.title, page: editablePage });
    res.render("public/ongoing-research-practical", { title: "Practical Implications" });
  } catch (err) {
    next(err);
  }
});

router.get("/ongoing-research/limitations-and-future-directions", async (req, res, next) => {
  try {
    const editablePage = await getEditablePage("ongoing-research/limitations-and-future-directions");
    if (editablePage) return res.render("public/editable-page", { title: editablePage.title, page: editablePage });
    res.render("public/ongoing-research-limitations", { title: "Limitations and Future Directions" });
  } catch (err) {
    next(err);
  }
});

router.get("/ongoing-research/:slug", async (req, res, next) => {
  try {
    const slug = String(req.params.slug || "");
    const fullSlug = `ongoing-research/${slug}`;

    const page =
      (await withPrismaFallback(
        () => prisma.page.findUnique({ where: { slug: fullSlug } }),
        null,
        `ongoing-research.slug:${fullSlug}`
      )) ||
      (await withPrismaFallback(
        () => prisma.page.findUnique({ where: { slug: `research/${slug}` } }),
        null,
        `ongoing-research.legacy:${slug}`
      ));

    res.render("public/generic-page", {
      title: page?.title || slug.replace(/-/g, " "),
      page,
      fullSlug,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/resources", async (req, res, next) => {
  try {
    const editablePage = await getEditablePage("resources");
    const menu = await withPrismaFallback(
      () =>
        prisma.menuItem.findFirst({
          where: { title: "Resources" },
          include: { children: { orderBy: { order: "asc" } } },
        }),
      null,
      "resources.index.menu"
    );

    res.render("public/resources-index", { title: "Resources", editablePage, menu });
  } catch (err) {
    next(err);
  }
});

router.get("/resources/articles", async (req, res, next) => {
  try {
    const category = typeof req.query.category === "string" ? req.query.category : "";

    const where = {
      published: true,
      ...(category ? { category } : {}),
    };

    const posts = await withPrismaFallback(
      () => prisma.post.findMany({ where, orderBy: { createdAt: "desc" } }),
      [],
      "resources.articles.posts"
    );

    const categories = await withPrismaFallback(
      () =>
        prisma.post.findMany({
          where: { published: true },
          select: { category: true },
          distinct: ["category"],
        }),
      [],
      "resources.articles.categories"
    );

    const editablePage = await getEditablePage("resources/articles");

    res.render("public/resources-articles", {
      title: "Articles",
      editablePage,
      posts,
      categories,
      selectedCategory: category,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/resources/downloads", async (req, res, next) => {
  try {
    const editablePage = await getEditablePage("resources/downloads");
    if (editablePage) return res.render("public/editable-page", { title: editablePage.title, page: editablePage });
    res.render("public/resources-downloads", { title: "Downloads" });
  } catch (err) {
    next(err);
  }
});

router.get("/resources/envisions", async (req, res, next) => {
  try {
    const editablePage = await getEditablePage("resources/envisions");
    if (editablePage) return res.render("public/editable-page", { title: editablePage.title, page: editablePage });
    res.render("public/resources-envisions", { title: "enVisions" });
  } catch (err) {
    next(err);
  }
});

router.get("/resources/faqs", async (req, res, next) => {
  try {
    const editablePage = await getEditablePage("resources/faqs");
    if (editablePage) return res.render("public/editable-page", { title: editablePage.title, page: editablePage });
    res.render("public/resources-faqs", { title: "FAQs" });
  } catch (err) {
    next(err);
  }
});

router.get("/resources/:slug", async (req, res, next) => {
  try {
    const slug = String(req.params.slug || "");
    const fullSlug = `resources/${slug}`;
    const page = await withPrismaFallback(
      () => prisma.page.findUnique({ where: { slug: fullSlug } }),
      null,
      `resources.slug:${fullSlug}`
    );

    res.render("public/generic-page", {
      title: page?.title || slug.replace(/-/g, " "),
      page,
      fullSlug,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/about", async (req, res, next) => {
  try {
    const editablePage = await getEditablePage("about");
    const menu = await withPrismaFallback(
      () =>
        prisma.menuItem.findFirst({
          where: { title: "About the Founder" },
          include: { children: { orderBy: { order: "asc" } } },
        }),
      null,
      "about.index.menu"
    );

    res.render("public/about-index", { title: "About", editablePage, menu });
  } catch (err) {
    next(err);
  }
});

router.get("/about/:slug", async (req, res, next) => {
  try {
    const slug = String(req.params.slug || "");
    const fullSlug = `about/${slug}`;
    const page = await withPrismaFallback(
      () => prisma.page.findUnique({ where: { slug: fullSlug } }),
      null,
      `about.slug:${fullSlug}`
    );

    res.render("public/generic-page", {
      title: page?.title || slug.replace(/-/g, " "),
      page,
      fullSlug,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

