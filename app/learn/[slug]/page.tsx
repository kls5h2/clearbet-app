import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LearnPage from "@/components/LearnPage";
import { LEARN_ARTICLES, getLearnArticle } from "@/lib/learn-content";
import { GLOSSARY_TERMS } from "@/lib/glossary-content";

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

  const relatedGlossaryTerms = GLOSSARY_TERMS
    .filter((t) => t.relatedSlugs?.includes(slug))
    .map((t) => ({ slug: t.slug, name: t.name }));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <LearnPage article={article} relatedGlossaryTerms={relatedGlossaryTerms} />
    </>
  );
}
