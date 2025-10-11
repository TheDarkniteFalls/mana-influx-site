
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.origin ?? "https://mparsonsauthor.com";

  const staticRoutes = [
    "",
    "/books",
    "/books/mana-influx",
    "/royal-road",
    "/about",
    "/updates",
    "/newsletter",
    "/contact",
    "/privacy",
    "/terms",
    "/cookies",
  ];

  const [books, updates] = await Promise.all([
    getCollection("books"),
    getCollection("updates"),
  ]);

  const bookUrls = books.map((book) => `/book/${book.slug}`);
  const updateUrls = updates.map((post) => `/updates/${post.slug}`);

  const urls = [...staticRoutes, ...bookUrls, ...updateUrls];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map((pathname) => {
      const loc = `${origin}${pathname}`;
      return `<url><loc>${xmlEscape(loc)}</loc></url>`;
    })
    .join("\n  ")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
