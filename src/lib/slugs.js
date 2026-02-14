function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizePageSlug(input) {
  return String(input || "")
    .split("/")
    .map((segment) => slugify(segment))
    .filter(Boolean)
    .join("/");
}

async function generateUniquePostSlug(prisma, title) {
  const baseSlug = slugify(title) || `post-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 2;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

module.exports = { slugify, normalizePageSlug, generateUniquePostSlug };

