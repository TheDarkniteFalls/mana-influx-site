import "dotenv/config";

import { load } from "cheerio";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type BookFormats =
  | "ebook"
  | "paperback"
  | "hardcover"
  | "audiobook"
  | "omnibus";

type AmazonMetadata = {
  slug: string;
  title: string;
  subtitle?: string;
  asin?: string;
  amazonUrl: string;
  cover?: string;
  releaseDate?: string;
  formats: BookFormats[];
  kindleUnlimited: boolean;
  blurb?: string;
};

type RoyalRoadMetadata = {
  title?: string;
  description?: string;
  cover?: string;
  updateSchedule?: string;
  tagline?: string;
  royalRoadUrl: string;
  highlights?: string[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.resolve(ROOT, "src", "content");
const BOOKS_DIR = path.join(CONTENT_DIR, "books");
const SERIES_DIR = path.join(CONTENT_DIR, "series");
const PUBLIC_IMAGES_DIR = path.join(ROOT, "public", "images", "books");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

interface CliOptions {
  amazon?: string[];
  royalRoad?: string;
  skipImages?: boolean;
}

function ensureArray<T>(value?: T | T[]): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function parseCliArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--amazon" || arg === "--amz") {
      const value = args[i + 1];
      if (value && !value.startsWith("--")) {
        options.amazon = ensureArray(options.amazon).concat(
          value.split(",").map((item) => item.trim()),
        );
        i += 1;
      }
    } else if (arg.startsWith("--amazon=")) {
      options.amazon = ensureArray(options.amazon).concat(
        arg.replace("--amazon=", "").split(",").map((item) => item.trim()),
      );
    } else if (arg === "--rr" || arg === "--royalroad") {
      const value = args[i + 1];
      if (value && !value.startsWith("--")) {
        options.royalRoad = value.trim();
        i += 1;
      }
    } else if (arg.startsWith("--rr=")) {
      options.royalRoad = arg.replace("--rr=", "").trim();
    } else if (arg === "--skip-images") {
      options.skipImages = true;
    }
  }

  if (!options.royalRoad) {
    const envRr =
      process.env.ROYALROAD_URL ||
      process.env.ROYAL_ROAD_URL ||
      process.env.RR_URL;
    if (envRr) {
      options.royalRoad = envRr.trim();
    }
  }

  if (!options.amazon?.length) {
    const envAmazon =
      process.env.AMAZON_SERIES_URL ||
      process.env.AMAZON_URL ||
      process.env.AMAZON_LINKS;
    if (envAmazon) {
      options.amazon = envAmazon
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return options;
}

async function fileExists(target: string) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) {
      console.warn(`⚠️  Fetch failed for ${url}: ${response.status}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.warn(`⚠️  Request error for ${url}:`, error);
    return null;
  }
}

async function updateJsonFile<T extends Record<string, unknown>>(
  relativePath: string,
  updater: (existing: T | null) => Promise<T>,
) {
  const targetPath = path.join(CONTENT_DIR, relativePath);
  await mkdir(path.dirname(targetPath), { recursive: true });
  const exists = await fileExists(targetPath);
  const existing = exists
    ? (JSON.parse(await readFile(targetPath, "utf-8")) as T)
    : null;
  const updated = await updater(existing);
  await writeFile(targetPath, JSON.stringify(updated, null, 2) + "\n", "utf-8");
  console.log(`✅  Updated ${relativePath}`);
}

async function downloadImage(url: string, slug: string) {
  await mkdir(PUBLIC_IMAGES_DIR, { recursive: true });
  const extension = path.extname(new URL(url).pathname) || ".jpg";
  const filePath = path.join(PUBLIC_IMAGES_DIR, `${slug}${extension}`);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok || !response.body) {
      console.warn(`⚠️  Could not download image ${url}`);
      return null;
    }

    await new Promise<void>((resolve, reject) => {
      const stream = createWriteStream(filePath);
      response.body.pipe(stream);
      response.body.on("error", reject);
      stream.on("finish", () => resolve());
    });

    return `/images/books/${path.basename(filePath)}`;
  } catch (error) {
    console.warn(`⚠️  Failed to download image ${url}:`, error);
    return null;
  }
}

async function fetchRoyalRoadMetadata(
  url: string,
): Promise<{ data: RoyalRoadMetadata; amazonLinks: string[] } | null> {
  const html = await fetchHtml(url);
  if (!html) return null;

  const $ = load(html);
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const ogDescription = $('meta[property="og:description"]').attr("content");
  const ogImage = $('meta[property="og:image"]').attr("content");
  const keywords = $('meta[name="keywords"]').attr("content");

  const amazonLinks = new Set<string>();
  $('a[href*="amazon."]').each((_, element) => {
    const href = $(element).attr("href");
    if (href) {
      const cleanHref = href.split("?")[0];
      amazonLinks.add(cleanHref);
    }
  });

  const highlights: string[] = [];
  if (keywords) {
    highlights.push(
      ...keywords
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 3),
    );
  }

  const data: RoyalRoadMetadata = {
    royalRoadUrl: url,
    title: ogTitle ?? $("h1").first().text().trim(),
    description: ogDescription ?? "",
    cover: ogImage,
    tagline: $("h2.font-red-sunglo").text().trim() || undefined,
    highlights,
  };

  return { data, amazonLinks: [...amazonLinks] };
}

function extractAsinFromUrl(url: string) {
  const asinMatch = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  if (asinMatch) {
    return asinMatch[1].toUpperCase();
  }
  return undefined;
}

async function fetchAmazonMetadata(url: string): Promise<AmazonMetadata | null> {
  const html = await fetchHtml(url);
  if (!html) return null;

  const $ = load(html);

  const title = $("#productTitle").text().trim() || $("title").text().trim();
  if (!title) {
    console.warn(`⚠️  Unable to extract title for ${url}`);
  }

  const subtitle = $("#bookEdition").text().trim() || undefined;
  const cover =
    $("#landingImage").attr("src") ||
    $("#imgBlkFront").attr("src") ||
    $('meta[property="og:image"]').attr("content") ||
    undefined;

  const detailBullets: Record<string, string> = {};
  $("#detailBullets_feature_div li span.a-list-item").each((_, element) => {
    const text = $(element).text().trim().replace(/\s+/g, " ");
    const [key, value] = text.split(":");
    if (key && value) {
      detailBullets[key.trim().toLowerCase()] = value.trim();
    }
  });

  const publicationDate =
    detailBullets["publication date"] ||
    detailBullets["publication date ‏"] ||
    undefined;
  const asin =
    extractAsinFromUrl(url) ||
    detailBullets["asin"] ||
    detailBullets["asin ‏"] ||
    undefined;

  const formats: BookFormats[] = ["ebook"];
  $(".a-button-text").each((_, element) => {
    const format = $(element).text().trim().toLowerCase();
    if (format.includes("paperback")) formats.push("paperback");
    if (format.includes("hardcover")) formats.push("hardcover");
    if (format.includes("audiobook") || format.includes("audio"))
      formats.push("audiobook");
  });

  const hasKU =
    $("span:contains('Kindle Unlimited')").length > 0 ||
    $("img[alt*='Kindle Unlimited']").length > 0;

  const byline = $("#bylineInfo").text().trim();
  const subtitleCandidate =
    subtitle ||
    (byline && byline.includes("Kindle Edition") ? undefined : byline);

  const slug = slugify(title || asin || `book-${Date.now()}`);

  return {
    slug,
    title: title || "Untitled Amazon Book",
    subtitle: subtitleCandidate,
    asin: asin?.toUpperCase(),
    amazonUrl: url,
    cover,
    releaseDate: publicationDate,
    formats: Array.from(new Set(formats)),
    kindleUnlimited: hasKU,
    blurb: $("#bookDescription_feature_div").text().trim() || undefined,
  };
}

async function writeBookMetadata(
  metadata: AmazonMetadata,
  skipImages: boolean,
) {
  const { slug, cover, ...rest } = metadata;
  const coverPath =
    !skipImages && cover ? await downloadImage(cover, slug) : undefined;
  const targetJson = `${path.join("books", `${slug}.json`)}`;

  await updateJsonFile(targetJson, async (existing) => ({
    ...(existing ?? {}),
    title: rest.title,
    subtitle: rest.subtitle ?? (existing as AmazonMetadata | null)?.subtitle,
    series: (existing as unknown as { series?: string } | null)?.series ??
      "mana-influx",
    seriesOrder:
      (existing as unknown as { seriesOrder?: number } | null)?.seriesOrder ??
      undefined,
    blurb:
      rest.blurb ??
      (existing as unknown as { blurb?: string } | null)?.blurb ??
      "Update this blurb via content editing or a future fetch run.",
    asin: rest.asin,
    amazonUrl: rest.amazonUrl,
    releaseDate: rest.releaseDate,
    formats: rest.formats.length
      ? rest.formats
      : (existing as unknown as { formats?: BookFormats[] } | null)?.formats ??
        ["ebook"],
    kindleUnlimited: rest.kindleUnlimited,
    cover:
      coverPath ??
      (existing as unknown as { cover?: string } | null)?.cover ??
      undefined,
  }));
}

async function writeRoyalRoadMetadata(
  metadata: RoyalRoadMetadata,
) {
  const targetJson = path.join("series", "royal-road.json");

  await updateJsonFile(targetJson, async (existing) => ({
    ...(existing ?? {}),
    ...metadata,
    highlights: metadata.highlights?.length
      ? metadata.highlights
      : (existing?.highlights ?? []),
  }));
}

async function main() {
  const options = parseCliArgs();
  if (!options.royalRoad && !options.amazon?.length) {
    console.log(
      "ℹ️  Nothing to fetch. Provide --rr <url> or --amazon <url1,url2>.",
    );
    process.exit(0);
  }

  try {
    await mkdir(CONTENT_DIR, { recursive: true });
    await mkdir(BOOKS_DIR, { recursive: true });
    await mkdir(SERIES_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to prepare content directories:", error);
    process.exit(1);
  }

  let amazonLinks = new Set<string>(options.amazon ?? []);

  if (options.royalRoad) {
    console.log(`🌐  Fetching Royal Road metadata from ${options.royalRoad}`);
    const royalRoadResult = await fetchRoyalRoadMetadata(options.royalRoad);
    if (royalRoadResult) {
      await writeRoyalRoadMetadata(royalRoadResult.data);
      royalRoadResult.amazonLinks.forEach((link) =>
        amazonLinks.add(link),
      );
    } else {
      console.warn("⚠️  Unable to scrape Royal Road content; retaining seed data.");
    }
  }

  if (amazonLinks.size === 0) {
    console.log("ℹ️  No Amazon links to process.");
    return;
  }

  console.log(`🛒  Processing ${amazonLinks.size} Amazon link(s)…`);
  for (const link of amazonLinks) {
    console.log(`  → Fetching ${link}`);
    const metadata = await fetchAmazonMetadata(link);
    if (!metadata) {
      console.warn(`⚠️  Skipped: could not extract metadata for ${link}`);
      continue;
    }

    await writeBookMetadata(metadata, options.skipImages ?? false);
  }
}

main().catch((error) => {
  console.error("❌  Fetch script failed:", error);
  process.exit(1);
});
