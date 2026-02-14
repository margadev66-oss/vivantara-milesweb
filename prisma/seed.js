require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const { WRITING_CATEGORIES } = require("../src/lib/writing");
const {
  SITE_NAVIGATION,
  getDefaultEditablePages,
  getDefaultPageContent,
} = require("../src/lib/site-structure");
const { DEFAULT_HOME_CONTENT } = require("../src/lib/home-content");

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "password123";
  const password = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: "admin@vivartana.com" },
    update: { password, name: "Admin" },
    create: { email: "admin@vivartana.com", name: "Admin", password },
  });

  await prisma.menuItem.deleteMany({});

  for (let i = 0; i < SITE_NAVIGATION.length; i++) {
    const item = SITE_NAVIGATION[i];
    if (item.children && item.basePath) {
      const parent = await prisma.menuItem.create({
        data: { title: item.title, order: i, url: item.url },
      });

      for (let j = 0; j < item.children.length; j++) {
        const child = item.children[j];
        await prisma.menuItem.create({
          data: {
            title: child.title,
            order: j,
            parentId: parent.id,
            url: `/${item.basePath}/${child.slug}`,
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

  const postSlug = "example-article";
  await prisma.post.upsert({
    where: { slug: postSlug },
    update: {},
    create: {
      title: "The Impact of Adaptive Excellence",
      slug: postSlug,
      category: WRITING_CATEGORIES[3] || "Research Reflections",
      content: "<p>Deep dive into the AEF framework...</p>",
      published: true,
    },
  });

  await prisma.siteSetting.upsert({
    where: { key: "hero_statement" },
    update: {},
    create: {
      key: "hero_statement",
      value: "How your organisation responds when things go wrong tells the real story.",
    },
  });

  await prisma.siteSetting.upsert({
    where: { key: "about_bio" },
    update: {},
    create: {
      key: "about_bio",
      value:
        "Aumlan Guha is the Founder of Vivartana and an Organisational Stress Response Specialist and Transformation Partner.",
    },
  });

  await prisma.siteSetting.upsert({
    where: { key: "pillars_description" },
    update: {},
    create: {
      key: "pillars_description",
      value: JSON.stringify([
        "How teams perceive and interpret emerging challenges",
        "How people coordinate under ambiguity",
        "How leadership behaviour shapes organisational response",
        "How roles align with cognitive strengths",
        "How Cognitive Diversity and Neurodiversity become performance assets",
        "How the organisation holds together under stress",
      ]),
    },
  });

  await prisma.siteSetting.upsert({
    where: { key: "home_content" },
    update: {},
    create: {
      key: "home_content",
      value: JSON.stringify(DEFAULT_HOME_CONTENT),
    },
  });

  console.log("Seed completed");
  console.log(`Admin credentials: admin@vivartana.com / ${adminPassword}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

