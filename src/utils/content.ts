import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";

export type BookEntry = CollectionEntry<"books">;
export type SeriesEntry = CollectionEntry<"series">;
export type UpdateEntry = CollectionEntry<"updates">;

export async function loadBooks(): Promise<BookEntry[]> {
  const books = await getCollection("books");
  return books.sort((a, b) => {
    const orderA = a.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.data.title.localeCompare(b.data.title);
  });
}

export async function loadSeries(): Promise<Record<string, SeriesEntry>> {
  const series = await getCollection("series");
  return Object.fromEntries(series.map((entry) => [entry.slug, entry]));
}

export async function loadAuthor() {
  const authors = await getCollection("author");
  return authors[0]?.data ?? null;
}

export async function loadUpdates(): Promise<UpdateEntry[]> {
  const posts = await getCollection("updates");
  return posts.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
}

export function applyAmazonAssociateTag(
  url: string | undefined,
  tag: string | undefined,
): string | undefined {
  if (!url) return url;
  if (!tag) return url;
  try {
    const target = new URL(url);
    if (!target.searchParams.has("tag")) {
      target.searchParams.set("tag", tag);
    }
    return target.toString();
  } catch {
    return url;
  }
}
