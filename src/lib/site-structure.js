const SITE_NAVIGATION = [
  {
    title: "Engage with Us",
    url: "/engage",
    basePath: "engage",
    children: [
      { title: "Services Overview", slug: "services-overview" },
      { title: "How It Works", slug: "how-it-works" },
    ],
  },
  {
    title: "Knowledge Assets",
    url: "/knowledge-assets",
    basePath: "knowledge-assets",
    children: [
      { title: "Frameworks", slug: "frameworks" },
      { title: "Case Studies", slug: "case-studies" },
      { title: "Papers", slug: "papers" },
    ],
  },
  {
    title: "Ongoing Research",
    url: "/ongoing-research",
    basePath: "ongoing-research",
    children: [
      { title: "Introduction to Research", slug: "introduction-to-research" },
      { title: "Literature Review Summary", slug: "literature-review-summary" },
      { title: "Research Design and Methodology", slug: "research-design-and-methodology" },
      { title: "Practical Implications", slug: "practical-implications" },
      { title: "Limitations and Future Directions", slug: "limitations-and-future-directions" },
    ],
  },
  {
    title: "Resources",
    url: "/resources",
    basePath: "resources",
    children: [
      { title: "enVisions", slug: "envisions" },
      { title: "Articles", slug: "articles" },
      { title: "Downloads", slug: "downloads" },
      { title: "FAQs", slug: "faqs" },
    ],
  },
  {
    title: "Contact",
    url: "/contact",
  },
];

const EXTRA_EDITABLE_PAGES = [
  { title: "About the Founder", slug: "about" },
  { title: "Articles", slug: "writing" },
];

const DEFAULT_PAGE_MARKER = "This is the default content for";

function normalizeSlugFromUrl(url) {
  if (!url) return "";
  return url.replace(/^\/+/, "").replace(/\/+$/, "");
}

function addPageIfMissing(pages, seen, page) {
  if (!page.slug || seen.has(page.slug)) return;
  seen.add(page.slug);
  pages.push(page);
}

function getDefaultEditablePages() {
  const pages = [];
  const seen = new Set();

  for (const item of SITE_NAVIGATION) {
    if (item.basePath) {
      addPageIfMissing(pages, seen, { title: item.title, slug: item.basePath });
    } else {
      const slug = normalizeSlugFromUrl(item.url);
      if (slug) {
        addPageIfMissing(pages, seen, { title: item.title, slug });
      }
    }

    if (!item.children || !item.basePath) continue;

    for (const child of item.children) {
      addPageIfMissing(pages, seen, {
        title: child.title,
        slug: `${item.basePath}/${child.slug}`,
      });
    }
  }

  for (const extraPage of EXTRA_EDITABLE_PAGES) {
    addPageIfMissing(pages, seen, extraPage);
  }

  return pages;
}

function getDefaultPageContent(title) {
  return `<p>${DEFAULT_PAGE_MARKER} <strong>${title}</strong>. You can edit this in the Admin Panel.</p>`;
}

module.exports = {
  SITE_NAVIGATION,
  getDefaultEditablePages,
  getDefaultPageContent,
};

