import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LearnPage from "@/components/LearnPage";
import { LEARN_ARTICLES, getLearnArticle } from "@/lib/learn-content";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getLearnArticle(slug);
  if (!article) {
    return { title: "Not found — RawIntel" };
  }
  return {
    title: `${article.title} — RawIntel`,
    description: article.metaDescription,
  };
}

export function generateStaticParams() {
  return LEARN_ARTICLES.map((a) => ({ slug: a.slug }));
}

export default async function LearnSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const article = getLearnArticle(slug);
  if (!article) notFound();
  return <LearnPage article={article} />;
}
