import { defineCollection, z } from "astro:content";

const author = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    penName: z.string(),
    tagline: z.string(),
    shortBio: z.string(),
    longBio: z.string(),
    email: z.string().email(),
    socials: z.object({
      amazonAuthor: z.string().url().optional().nullable(),
      goodreads: z.string().url().optional().nullable(),
      twitter: z.string().url().optional().nullable(),
      instagram: z.string().url().optional().nullable(),
      facebook: z.string().url().optional().nullable(),
      tiktok: z.string().url().optional().nullable(),
      bluesky: z.string().url().optional().nullable(),
      royalRoad: z.string().url().optional().nullable(),
      youtube: z.string().url().optional().nullable(),
    }),
    headshot: z.string().optional(),
    ogImage: z.string().optional(),
  }),
});

const books = defineCollection({
  type: "data",
  schema: z.object({
    series: z.string().default("mana-influx"),
    seriesOrder: z.number().int().nonnegative().optional(),
    title: z.string(),
    subtitle: z.string().optional(),
    blurb: z.string(),
    releaseDate: z.string().optional(),
    asin: z.string().optional(),
    amazonUrl: z.string().url().optional().nullable(),
    kindleUnlimited: z.boolean().default(false),
    formats: z
      .array(
        z.enum(["ebook", "paperback", "hardcover", "audiobook", "omnibus"]),
      )
      .default(["ebook"]),
    isbn10: z.string().optional(),
    isbn13: z.string().optional(),
    goodreadsUrl: z.string().url().optional().nullable(),
    audibleUrl: z.string().url().optional().nullable(),
    cover: z.string().optional(),
    excerptUrl: z.string().url().optional().nullable(),
    contentWarnings: z.array(z.string()).default([]),
    reviews: z
      .array(
        z.object({
          source: z.string(),
          quote: z.string(),
          attribution: z.string().optional(),
        }),
      )
      .default([]),
  }),
});

const series = defineCollection({
  type: "data",
  schema: z.object({
    title: z.string(),
    tagline: z.string().optional(),
    description: z.string(),
    royalRoadUrl: z.string().url().optional(),
    updateSchedule: z.string().optional(),
    cover: z.string().optional(),
    readingOrder: z.array(z.string()).optional(),
    featured: z.string().optional(),
    cta: z
      .object({
        label: z.string(),
        href: z.string(),
      })
      .optional(),
    highlights: z.array(z.string()).default([]),
  }),
});

const updates = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    excerpt: z.string().optional(),
    heroImage: z.string().optional(),
  }),
});

export const collections = {
  author,
  books,
  series,
  updates,
};
