# Mana Influx Author Site

Exploration/prototype for an author website supporting Mike Parsons, author of The Mana Influx Series and Soul Spark Reclaimer.

This repository is public as a portfolio and development artifact. It is not currently a reusable website template, and the fiction-related material in this repository is not open-licensed for reuse.

## Rights And Licensing

Unless a separate license file says otherwise:

- Website code may be adapted only under the license terms provided in this repository.
- Prose, series names, fictional setting material, book metadata, images, branding, and other creative content remain copyright Mike Parsons and are not licensed for reuse.

If this project becomes a reusable template later, the code and creative-content licenses should be separated explicitly.

## Quick Start

```bash
npm install
npm run dev
```

- Local dev server: http://localhost:4321
- Production build preview: `npm run build && npm run preview`
- Content fetcher: `npm run fetch -- --rr <royal-road-url> --amazon <amazon-url,amazon-url>`

The fetch script enriches `src/content` JSON files and downloads cover art into `public/images/books`. It falls back to the checked-in seed data if a request fails, so builds remain deterministic.

## Project Structure

```
public/
  images/
    author/           # Headshot placeholder
    books/            # Cover art (placeholder + fetched assets)
    og/               # Default Open Graph image
src/
  components/         # Reusable UI elements (header, forms, promo blocks)
  content/            # Content collections (author, books, series, updates)
  layouts/            # Base layout with SEO + analytics hooks
  pages/              # Astro pages and endpoints (robots, sitemap)
  styles/             # Tailwind global stylesheet
  utils/              # Content + formatting helpers
scripts/
  fetch-content.ts    # Royal Road + Amazon ingestion utility
```

Key routes include:

- `/` - hero, featured book, newsletter CTA, Royal Road promo, recent updates
- `/books` and `/books/mana-influx` - grid view and reading order
- `/book/[slug]` - individual book pages with sticky mobile buy bar
- `/royal-road`, `/about`, `/updates`, `/newsletter`, `/contact`
- Legal/supporting pages: `/privacy`, `/terms`, `/cookies`, `/sitemap.xml`, `/robots.txt`

## Content Collections

| Collection | Location                         | Notes                                             |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `author`   | `src/content/author/*.json`      | Primary author profile (name, bios, socials)      |
| `books`    | `src/content/books/*.json`       | One JSON file per title/omnibus                   |
| `series`   | `src/content/series/*.json`      | Metadata for Mana Influx + Royal Road pages       |
| `updates`  | `src/content/updates/*.md`       | Markdown updates with frontmatter (`title`, `date`) |

Edit files directly or use the fetch script to refresh details from Royal Road / Amazon.

## Environment Variables

Copy `.env.example` to `.env` and fill in values before deploying.

| Variable | Purpose |
| -------- | ------- |
| `ROYALROAD_URL` | Default Royal Road page for the fetch script |
| `AMAZON_SERIES_URL` | Optional Amazon collection URL (fetch script) |
| `PUBLIC_CONVERTKIT_FORM_ID` | ConvertKit form ID for newsletter embeds |
| `CONVERTKIT_API_KEY` | Optional if switching to API-based submissions |
| `GA_MEASUREMENT_ID` | Enables Google Analytics 4 (optional) |
| `AMAZON_ASSOC_TAG` | Amazon Associates tag appended to buy links |
| `PUBLIC_FORMSPREE_ENDPOINT` | Contact form POST endpoint (Formspree) |

When unset, the newsletter/contact forms use placeholders and GA code remains disabled.

## Deployment (Vercel)

1. Push this repo to GitHub/GitLab.
2. Create a Vercel project and import the repository.
3. Add the environment variables above in the Vercel dashboard.
4. After the first deploy, assign the custom domain `mparsonsauthor.com`.
5. Configure DNS (Google Domains / Workspace):
   - `mparsonsauthor.com` -> A record `76.76.21.21`
   - `www` -> CNAME `cname.vercel-dns.com`
6. The included `vercel.json` redirects `www` to the apex domain.

The project builds to static HTML/JS/CSS (`dist/`) so Vercel can serve it directly without a Node runtime.

## Quality Targets

- `npm run build` validates content schemas and generates the static site.
- Lighthouse goal: >=90 across Performance, SEO, Accessibility, Best Practices once production assets are in place.
- Tailwind typography plugin powers prose styling; review fetch-script output for formatting after large ingests.

## Next Steps

- Replace placeholder covers via `npm run fetch` or manual uploads in `public/images/books`.
- Fill in Amazon/Goodreads/Audible links for placeholder book entries when available.
- Configure `PUBLIC_CONVERTKIT_FORM_ID` and `PUBLIC_FORMSPREE_ENDPOINT` before launch.
- Enable `GA_MEASUREMENT_ID` and add a banner if required when analytics are desired.
