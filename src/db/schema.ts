import { relations } from "drizzle-orm";
import { usersSync } from "drizzle-orm/neon";
import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = usersSync;

export const articles = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title").notNull(),
  slug: varchar("slug").notNull().unique(),
  content: text("content").notNull(),
  imageUrl: varchar("image_url"),
  published: boolean("published").default(false).notNull(),
  authorId: varchar("author_id")
    .notNull()
    .references(() => usersSync.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull().unique(),
  createdAt: timestamp("createdAt", { mode: "string" }).notNull().defaultNow(),
});

export const articleTags = pgTable("articleTags", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id")
    .references(() => articles.id, { onDelete: "cascade" })
    .notNull(),
  tagId: uuid("tag_id")
    .references(() => tags.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("createdAt", { mode: "string" }).notNull().defaultNow(),
});

export const userRelations = relations(usersSync, ({ many }) => ({
  articles: many(articles),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  user: one(usersSync, {
    fields: [articles.authorId],
    references: [usersSync.id],
  }),
  articleTags: many(articleTags),
}));

export const tagsRelation = relations(tags, ({ many }) => ({
  articleTags: many(articleTags),
}));

export const articleTagsRelation = relations(articleTags, ({ one }) => ({
  article: one(articles, {
    fields: [articleTags.articleId],
    references: [articles.id],
  }),
  tag: one(tags, {
    fields: [articleTags.tagId],
    references: [tags.id],
  }),
}));

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
