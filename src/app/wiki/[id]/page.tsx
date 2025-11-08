import { notFound } from "next/navigation";
import WikiArticleViewer from "@/components/wiki-article-viewer";
import { articles } from "@/db/schema";
import { getArticleById } from "@/lib/data/articles";
import { stackServerApp } from "@/stack/server";

interface ViewArticlePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ViewArticlePage({
  params,
}: ViewArticlePageProps) {
  const { id } = await params;
  const user = await stackServerApp.getUser();

  articles;
  const article = await getArticleById(id);

  if (!article) {
    notFound();
  }

  const canEdit = article.authorId === user?.id; // Set to true for demonstration

  return <WikiArticleViewer article={article} canEdit={canEdit} />;
}
