const { prisma, withPrismaFallback } = require("./prisma");

const DEFAULT_PAGE_MARKER = "This is the default content for";

function toPlainText(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function getEditablePage(slug) {
  const page = await withPrismaFallback(
    () => prisma.page.findUnique({ where: { slug } }),
    null,
    `getEditablePage:${slug}`
  );

  if (!page) return null;

  const plainText = toPlainText(page.content || "");
  if (!plainText || plainText.includes(DEFAULT_PAGE_MARKER)) {
    return null;
  }

  return page;
}

module.exports = { getEditablePage };

