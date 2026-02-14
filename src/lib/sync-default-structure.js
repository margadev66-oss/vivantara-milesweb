const { SITE_NAVIGATION, getDefaultEditablePages, getDefaultPageContent } = require("./site-structure");

async function syncDefaultStructure(prisma) {
  await prisma.menuItem.deleteMany({});

  for (let i = 0; i < SITE_NAVIGATION.length; i++) {
    const item = SITE_NAVIGATION[i];

    if (item.children && item.basePath) {
      const parent = await prisma.menuItem.create({
        data: {
          title: item.title,
          order: i,
          url: item.url,
        },
      });

      for (let j = 0; j < item.children.length; j++) {
        const child = item.children[j];
        const fullPath = `/${item.basePath}/${child.slug}`;

        await prisma.menuItem.create({
          data: {
            title: child.title,
            order: j,
            parentId: parent.id,
            url: fullPath,
          },
        });
      }

      continue;
    }

    await prisma.menuItem.create({
      data: { title: item.title, order: i, url: item.url },
    });
  }

  const defaultPages = getDefaultEditablePages();
  for (const page of defaultPages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {},
      create: {
        title: page.title,
        slug: page.slug,
        content: getDefaultPageContent(page.title),
      },
    });
  }
}

module.exports = { syncDefaultStructure };

