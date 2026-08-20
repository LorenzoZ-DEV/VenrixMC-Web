import { prisma } from "./prisma";
import { cached, TTL } from "./cache";
import { keys } from "./redis";

const PAGE_SIZE = 9;

export async function getLatestNews(count: number) {
  return cached(keys.cache("news", `latest-${count}`), TTL.NEWS_LIST, async () => {
    return prisma.news.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: count,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        createdAt: true,
      },
    });
  });
}

export async function getNewsPage(page: number) {
  const safePage = Math.max(1, page);

  return cached(keys.cache("news", `page-${safePage}`), TTL.NEWS_LIST, async () => {
    const [items, total] = await Promise.all([
      prisma.news.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        skip: (safePage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          createdAt: true,
        },
      }),
      prisma.news.count({ where: { published: true } }),
    ]);

    return { items, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
  });
}

export async function getNewsBySlug(slug: string) {
  return cached(keys.cache("news", slug), TTL.NEWS_ITEM, async () => {
    return prisma.news.findFirst({
      where: { slug, published: true },
      include: { author: { select: { username: true } } },
    });
  });
}
