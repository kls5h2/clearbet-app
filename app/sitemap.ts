import type { MetadataRoute } from "next";
import { LEARN_ARTICLES } from "@/lib/learn-content";
import { GLOSSARY_TERMS } from "@/lib/glossary-content";

const BASE = "https://rawintelsports.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,            lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/intel`,       lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/learn`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/glossary`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/how-it-works`,lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/about`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const learnRoutes: MetadataRoute.Sitemap = LEARN_ARTICLES.map((a) => ({
    url: `${BASE}/learn/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const glossaryRoutes: MetadataRoute.Sitemap = GLOSSARY_TERMS.map((t) => ({
    url: `${BASE}/glossary/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...learnRoutes, ...glossaryRoutes];
}
