# Idea Check — AI Business Model Tester (MERN + Apify + Claude)

## 1. What it does

You type in any business (name + description + optional market, price, website).
The app then:

1. **Plans research** — Claude turns the idea into a category, a buyer profile and 8 Google queries (home market + international).
2. **Searches the market** — Apify `google-search-scraper` runs those queries and collects organic results.
3. **Picks real competitors** — Claude filters the results to up to 10 actual brands (direct / indirect, home / international), skipping news, Wikipedia and research pages.
4. **Reads competitor websites** — Apify `website-content-crawler` (cheap cheerio mode) reads up to 3 pages per competitor site.
5. **Writes the report** — Claude produces a structured JSON report:
   - Viability score (0–100) + verdict + reasoning
   - Market overview, trends, customer segments
   - Competitor table: positioning, products, pricing, channels, strengths, weaknesses, threat level
   - SWOT for your business
   - Market gaps you can own
   - Recommendations grouped **Do now / Next 1–3 months / Later**
   - Business model: revenue streams, pricing, channels, unit economics, risks
   - Cheap experiments to validate demand before spending big
   - 3 ready-to-post captions (Instagram, LinkedIn, X)
6. **Delivers & posts** — view in the dashboard, download as Markdown, create a public share link, and **Publish** any post straight to a Make.com / Zapier / n8n webhook that posts to your social accounts.

## 2. Architecture

```
React (Vite)  ──/api──►  Express API  ──►  MongoDB (analyses)
                              │
                              ├─► Apify: google-search-scraper
                              ├─► Apify: website-content-crawler
                              ├─► Anthropic: Claude (plan → select → report)
                              └─► Publish webhook (Make / Zapier / n8n) → Instagram / LinkedIn / X
```

The pipeline runs as a background job inside the API process. The client polls `GET /api/analyses/:id` every 3 s and shows live step progress.

## 3. Folder structure

```
ai-business-analyzer/
├─ package.json              # root scripts: install:all, dev, build, start
├─ docs/PROJECT_SPEC.md
├─ server/
│  ├─ .env.example
│  └─ src/
│     ├─ index.js            # express app, security, static client in prod
│     ├─ config/db.js
│     ├─ models/Analysis.js
│     ├─ routes/             # analysis.routes.js, public.routes.js
│     ├─ controllers/analysis.controller.js
│     ├─ services/
│     │  ├─ apify.service.js     # googleSearch(), crawlSites()
│     │  ├─ claude.service.js    # planResearch(), selectCompetitors(), writeReport()
│     │  ├─ pipeline.service.js  # orchestrates the 5 steps
│     │  └─ publish.service.js   # webhook publishing
│     └─ utils/              # json extraction, markdown export
└─ client/
   └─ src/
      ├─ pages/              # Home, ReportPage, SharedReport
      └─ components/         # Progress, ReportView, ScoreRing, PostCard
```

## 4. Data model (MongoDB `analyses`)

| Field | Type | Notes |
|---|---|---|
| business | object | name, description, industry, location, website, targetMarket, priceRange, knownCompetitors |
| status | enum | queued → planning → searching → selecting → crawling → analyzing → done / failed |
| stepMessage | string | shown in the progress UI |
| plan | mixed | Claude research plan |
| searchResults | array | trimmed Google results (max 120) |
| competitorsFound | array | selected competitors |
| crawled | array | url/title/description of crawled pages |
| report | mixed | final JSON report |
| warnings | [string] | e.g. crawl failed, expected competitors missing |
| isPublic | bool | enables `/share/:id` |
| publishLog | array | platform, ok, message, at |

## 5. API

| Method | Route | Purpose |
|---|---|---|
| GET | /api/health | shows which keys are configured |
| POST | /api/analyses | create + start a run (rate limited 20/hour) |
| GET | /api/analyses | list last 50 |
| GET | /api/analyses/:id | full document (poll this) |
| POST | /api/analyses/:id/rerun | run again |
| DELETE | /api/analyses/:id | delete |
| GET | /api/analyses/:id/markdown | download report `.md` |
| POST | /api/analyses/:id/share | `{ isPublic: true/false }` |
| POST | /api/analyses/:id/publish | `{ postIndex, caption?, hashtags? }` → webhook |
| GET | /api/public/:id | read-only public report |

## 6. Setup

```bash
# 1. install
npm run install:all

# 2. configure
cp server/.env.example server/.env
# fill ANTHROPIC_API_KEY, APIFY_TOKEN, MONGODB_URI (+ optional PUBLISH_WEBHOOK_URL)

# 3. run (API :5000 + React :5173)
npm run dev

# production
npm run build && npm start      # Express serves client/dist
```

Requirements: Node 18.17+, MongoDB (local or Atlas free tier), Apify account with credits, Anthropic API key.

## 7. "Post directly" — how publishing works

Direct posting to Instagram needs a Meta Business account, a Facebook app and app review; LinkedIn and X have their own approvals. To avoid weeks of API approvals, the app sends each post to **one webhook**:

1. In Make.com (or Zapier / n8n) create a scenario that starts with **Custom webhook**.
2. Add a router on `platform` → Instagram Business "Create a post", LinkedIn "Create a share", X "Create a post".
3. Paste the webhook URL into `PUBLISH_WEBHOOK_URL` and restart.

Payload sent:

```json
{ "platform": "instagram", "caption": "...", "hashtags": ["#..."], "text": "caption + hashtags", "business": "NIVAHN", "analysisId": "..." }
```

Instagram needs an image; in Make, add an image step (e.g. a fixed brand image or a Canva/Placid template) before the Instagram module.

## 8. Cost per run (rough)

- Apify: 8 Google queries + ~18 crawled pages — typically a few cents. Lower `MAX_COMPETITORS_TO_CRAWL` to cut cost.
- Claude: 3 calls, the report call is the largest (~15–25k input tokens).

## 9. Roadmap (phase 2)

- Auth (JWT) + teams, so multiple founders can use it
- Scheduled re-runs to track competitor price changes monthly
- Instagram/YouTube competitor scraping with Apify social actors (followers, engagement, top posts)
- Amazon/Flipkart review mining for "what customers complain about"
- PDF export with brand styling
- Queue (BullMQ + Redis) instead of in-process jobs for scale
