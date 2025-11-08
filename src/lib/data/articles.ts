import { eq } from "drizzle-orm";
import { z } from "zod";
import db from "@/db";
import { articles } from "@/db/schema";

const ArticleSchema = z.object({
  id: z.string().min(10),
  title: z.string().min(1),
  createdAt: z.string(),
  content: z.string().min(1),
  author: z.string().min(2),
  tags: z.array(z.string()).default([]),
  authorId: z.string().optional(),
});

type ArticleZod = z.infer<typeof ArticleSchema>;

const withJoins = {
  user: { columns: { name: true } },
  articleTags: {
    columns: {},
    with: { tag: { columns: { name: true } } },
  },
} as const;

export async function getArticles(): Promise<ArticleZod[]> {
  const articles = await db.query.articles.findMany({ with: withJoins });
  const shapedArticles = articles.map((article) => ({
    id: article.id,
    title: article.title,
    createdAt: article.createdAt,
    content: article.content,
    author: article.user?.name ?? "Unknown",
    imageUrl: article.imageUrl,
    tags: article.articleTags?.map((t) => t.tag?.name).filter(Boolean) ?? [],
  }));

  shapedArticles.forEach((article) => {
    try {
      z.parse(ArticleSchema, article);
    } catch (e) {
      console.error("failed to parse schema", e);
    }
  });

  return shapedArticles;
}

export async function getArticleById(id: string): Promise<ArticleZod | null> {
  try {
    const article = await db.query.articles.findFirst({
      where: eq(articles.id, id),
      with: withJoins,
    });

    if (!article) return null;

    const shapedArticle = {
      id: article.id,
      title: article.title,
      createdAt: article.createdAt,
      content: article.content,
      author: article.user?.name ?? "Unknown",
      imageUrl: article.imageUrl,
      authorId: article.authorId,
      tags: article.articleTags?.map((t) => t.tag?.name).filter(Boolean) ?? [],
    };

    return shapedArticle;
  } catch (e) {
    console.error(e);
    return null;
  }
}
