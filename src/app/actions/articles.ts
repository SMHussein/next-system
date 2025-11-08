"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import z from "zod";
import db from "@/db";
import { articles } from "@/db/schema";
import { stackServerApp } from "@/stack/server";
import { validateBody } from "../middleware/validation";

const createArticleSchema = z.object({
  title: z.string().min(5),
  content: z.string().min(10),
  authorId: z.string(),
  imageUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  slug: z.string().min(1),
  published: z.boolean().optional(),
});

const updateArticleSchema = z.object({
  title: z.string().min(5),
  content: z.string().min(10),
  imageUrl: z.string().min(10).optional(),
  tags: z.array(z.string()).optional(),
});

type NewArticle = z.infer<typeof createArticleSchema>;
type UpdateArticleInput = z.infer<typeof updateArticleSchema>;

export async function createArticle(body: NewArticle) {
  try {
    const user = await stackServerApp.getUser();

    if (!user) {
      throw new Error("❌ Unauthorized");
    }

    const articleBody: NewArticle = {
      title: body.title,
      content: body.content,
      authorId: user.id,
      imageUrl: body.imageUrl,
      tags: body.tags,
      slug: `${Date.now()}`,
      published: true,
    };

    const result = validateBody(createArticleSchema, articleBody);

    if (!result.success)
      throw new Error(`Zod validation faild ${result.error?.message}`);

    const [article] = await db.insert(articles).values(result.data).returning();

    return { success: true, message: "Article create logged (stub)", article };
  } catch (e) {
    console.error(e);
    return { error: `Something went wrong while creating the article ! ${e}` };
  }
}

export async function updateArticle(id: string, body: UpdateArticleInput) {
  try {
    const user = await stackServerApp.getUser();

    if (!user) {
      throw new Error("❌ Unauthorized");
    }

    const result = validateBody(updateArticleSchema, body);

    if (!result.success)
      throw new Error(`Zod validation faild ${result.error}`);

    const [article] = await db
      .update(articles)
      .set(result.data)
      .where(and(eq(articles.id, id), eq(articles.authorId, user.id)))
      .returning();

    if (!article) throw new Error("Article not found");

    return {
      success: true,
      message: `Article ${id} update logged (stub)`,
      article,
    };
  } catch (e) {
    console.error(e);
    return { error: `Something went wrong wihle updating the article! ${e}` };
  }
}

export async function deleteArticle(id: string) {
  try {
    const user = await stackServerApp.getUser();

    if (!user) {
      throw new Error("❌ Unauthorized");
    }

    const [article] = await db
      .delete(articles)
      .where(and(eq(articles.authorId, user.id), eq(articles.id, id)))
      .returning();

    if (!article) throw new Error("Article not found");

    return {
      success: true,
      message: `Article ${id} delete logged (stub)`,
      article,
    };
  } catch (e) {
    console.error(e);
    return { error: `Something went wrong wihle deleting the article! ${e}` };
  }
}

export async function deleteArticleForm(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (!id) {
    throw new Error("Missing article id");
  }

  await deleteArticle(String(id));
  // After deleting, redirect the user back to the homepage.
  redirect("/");
}
