const { prisma, withPrismaFallback } = require("../lib/prisma");
const { SITE_NAVIGATION } = require("../lib/site-structure");

const ENGAGE_CHILDREN = [
  { title: "Services Overview", url: "/engage/services-overview" },
  { title: "How It Works", url: "/engage/how-it-works" },
];

function normalizeEngageChildren(children) {
  const byUrl = new Map(children.map((child) => [child.url, child]));

  return ENGAGE_CHILDREN.map((item, index) => {
    const existing = byUrl.get(item.url);
    return {
      id: existing?.id ?? `engage-fallback-${index}`,
      title: item.title,
      url: item.url,
      order: index,
    };
  });
}

function fallbackMenuItems() {
  return SITE_NAVIGATION.map((item, index) => ({
    id: `fallback-${index}`,
    title: item.title,
    url: item.url,
    order: index,
    children:
      item.children && item.basePath
        ? item.children.map((child, childIndex) => ({
            id: `fallback-${index}-${childIndex}`,
            title: child.title,
            url: `/${item.basePath}/${child.slug}`,
            order: childIndex,
          }))
        : [],
  }));
}

async function loadMenu(req, res, next) {
  const menuItems = await withPrismaFallback(
    () =>
      prisma.menuItem.findMany({
        where: { parentId: null },
        select: {
          id: true,
          title: true,
          url: true,
          order: true,
          children: {
            select: {
              id: true,
              title: true,
              url: true,
              order: true,
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      }),
    fallbackMenuItems(),
    "loadMenu.menuItems"
  );

  res.locals.menuItems = menuItems.map((item) => {
    if (item.url === "/engage") {
      return {
        ...item,
        children: normalizeEngageChildren(item.children || []),
      };
    }

    return item;
  });

  next();
}

module.exports = { loadMenu };

