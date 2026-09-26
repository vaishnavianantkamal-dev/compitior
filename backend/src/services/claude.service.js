import Anthropic from '@anthropic-ai/sdk';
import { extractJson } from '../utils/json.js';

let client;
let clientKey;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is missing in server/.env');
  if (!client || clientKey !== process.env.ANTHROPIC_API_KEY) {
    clientKey = process.env.ANTHROPIC_API_KEY;
    client = new Anthropic({ apiKey: clientKey });
  }
  return client;
}

const model = () => process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

const BASE_SYSTEM = `You are a senior strategy analyst who helps founders test business ideas.
You are evidence-first: facts about competitors must come from the research data you are given.
If something is not in the data, write "unknown" instead of guessing.
You always reply with a single valid JSON object and nothing else - no markdown fences, no commentary.`;

// Calls Claude and parses JSON. Retries with a repair instruction if parsing fails; if the
// reply was cut off by the token limit, also asks for shorter fields and raises the budget,
// since a fixed max_tokens guess can't account for how verbose the model decides to be.
export async function askJson(prompt, { maxTokens = 4000, system = BASE_SYSTEM } = {}) {
  const messages = [{ role: 'user', content: prompt }];
  let budget = maxTokens;

  for (let attempt = 0; attempt < 3; attempt++) {
    const msg = await getClient().messages.create({ model: model(), max_tokens: budget, system, messages });
    const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
    try {
      return extractJson(text);
    } catch (err) {
      if (attempt === 2) {
        throw new Error(`Claude returned unusable JSON (${err.message}). stop_reason=${msg.stop_reason}`);
      }
      messages.push({ role: 'assistant', content: text });
      if (msg.stop_reason === 'max_tokens') {
        budget = Math.round(budget * 1.6);
        messages.push({
          role: 'user',
          content: 'That got cut off before the JSON finished. Reply again with ONLY the JSON object, but make every text field much shorter (a few words each) so the whole thing fits.',
        });
      } else {
        messages.push({ role: 'user', content: 'That was not valid JSON. Reply again with ONLY the JSON object.' });
      }
    }
  }
}

const businessBlock = (b) => `BUSINESS
Name: ${b.name}
Description: ${b.description}
Industry: ${b.industry || 'not given'}
Location / home market: ${b.location || 'not given'}
Website: ${b.website || 'not given'}
Target market: ${b.targetMarket || 'not given'}
Price range: ${b.priceRange || 'not given'}
Competitors the founder already knows: ${b.knownCompetitors || 'none given'}`;

// Step 1: turn the idea into a research plan (search queries).
export function planResearch(business) {
  const loc = business.location?.trim();
  const localityRule = loc
    ? `This is a LOCAL business based in "${loc}". Every single search query must include that exact place name (city/area), e.g. "best X in ${loc}", "X near ${loc}", "X ${loc}". Do NOT write generic national or worldwide queries, and do NOT search for brands outside "${loc}" - a customer here would not travel elsewhere or order internationally for this kind of business.`
    : `No specific location was given, so search broadly for this category.`;

  return askJson(
    `${businessBlock(business)}

Create a research plan to find this business's REAL, LOCAL competitors.
${localityRule}
Return JSON:
{
  "category": "short product/service category",
  "industry": "industry name",
  "customerProfile": "one sentence on the most likely buyer",
  "searchQueries": ["8 Google queries, all scoped to the business's own local area as described above"]
}`,
    { maxTokens: 1200 }
  );
}

// Step 2: pick real competitors from raw Google results.
export function selectCompetitors(business, searchResults, maxCompetitors = 10) {
  const compact = searchResults
    .map((r, i) => `[${i}] ${r.title} | ${r.url} | ${r.description?.slice(0, 200)}`)
    .join('\n');

  const loc = business.location?.trim();
  const localityRule = loc
    ? `This business only serves customers in "${loc}". ONLY pick competitors that genuinely operate in or deliver to "${loc}" - a real local outlet, branch, or confirmed delivery/service coverage there. EXCLUDE any brand that is only present elsewhere (other cities, other countries) with no real presence in "${loc}", even if it looks like a "big name" - it is not a real competitor for this founder if a customer in "${loc}" cannot actually buy from it. Set "region" to "home" for every one of these (they are all local by definition); only use "international" for a brand you're confident ships to or operates in "${loc}" from abroad.`
    : `No specific location was given - prefer a mix of direct and indirect competitors, home-market and international.`;

  return askJson(
    `${businessBlock(business)}

GOOGLE RESULTS
${compact}

Pick up to ${maxCompetitors} real companies/brands that compete with this business.
Rules: use each brand's own website (not Amazon/Flipkart/news/Wikipedia/research pages) when available;
if a brand only appears on a marketplace, keep the marketplace URL and set "channel":"marketplace".
Skip the business itself. ${localityRule}
Keep every field short - "why" is at most 8 words, no extra commentary anywhere.
Return JSON:
{
  "competitors": [
    { "name": "", "url": "", "type": "direct|indirect", "region": "home|international", "channel": "own-site|marketplace", "why": "max 8 words" }
  ],
  "notInResults": ["well-known LOCAL competitors you expected but did not see in the results (names only)"]
}`,
    { maxTokens: 5000 }
  );
}

// Step 3: write the full report.
export function writeReport(business, plan, competitors, crawled, searchResults) {
  const siteText = crawled
    .map((c) => `URL: ${c.url}\nTITLE: ${c.title}\nMETA: ${c.description}\nTEXT: ${c.text}`)
    .join('\n---\n')
    .slice(0, 60000);

  const snippets = searchResults
    .slice(0, 60)
    .map((r) => `${r.title} | ${r.url} | ${r.description?.slice(0, 180)}`)
    .join('\n');

  return askJson(
    `${businessBlock(business)}

RESEARCH PLAN
${JSON.stringify(plan)}

COMPETITORS SELECTED
${JSON.stringify(competitors)}

COMPETITOR WEBSITE CONTENT (scraped)
${siteText || 'none - crawl failed or skipped'}

GOOGLE SNIPPETS
${snippets}

Write a competitor analysis and business-model test for the founder. Be specific and practical; no generic advice.
Return JSON with exactly this shape:
{
  "summary": "4-6 sentence executive summary",
  "viability": { "score": 0-100, "verdict": "Strong|Promising|Risky|Weak", "reasoning": "3-5 sentences" },
  "market": {
    "overview": "paragraph",
    "trends": ["5 trends"],
    "segments": [ { "name": "", "description": "", "fit": "high|medium|low" } ]
  },
  "competitors": [
    {
      "name": "", "url": "", "region": "home|international", "type": "direct|indirect",
      "positioning": "", "products": "", "pricing": "prices seen in data or 'unknown'",
      "channels": "", "strengths": [""], "weaknesses": [""], "threatLevel": "high|medium|low"
    }
  ],
  "swot": { "strengths": [], "weaknesses": [], "opportunities": [], "threats": [] },
  "gaps": ["market gaps this business can own"],
  "recommendations": [ { "title": "", "detail": "", "priority": "now|next|later", "impact": "high|medium|low" } ],
  "businessModel": {
    "revenueStreams": [""], "pricing": "", "channels": [""], "unitEconomics": "", "risks": [""]
  },
  "experiments": [ { "hypothesis": "", "test": "", "metric": "", "budget": "" } ],
  "posts": [
    { "platform": "instagram", "goal": "", "caption": "", "hashtags": [""] },
    { "platform": "linkedin", "goal": "", "caption": "", "hashtags": [""] },
    { "platform": "x", "goal": "", "caption": "", "hashtags": [""] }
  ]
}
Include 6-10 recommendations, 3-5 experiments and exactly 3 posts. Posts promote the founder's business using the positioning you recommend.
Avoid health or medical cure claims in posts.`,
    { maxTokens: 12000 }
  );
}

// Content Studio: suggest blog topic headlines for a niche.
export function suggestTopics(seed, count = 10) {
  return askJson(
    `Suggest ${count} sharp, specific blog post topic headlines for this niche:
"${seed || 'AI-powered business validation, market research and competitor analysis for startup founders'}"

Rules: each headline should be something a founder would actually click and share, no generic filler like "The Importance of X".
Return JSON:
{ "topics": ["headline 1", "headline 2", ...] }`,
    { maxTokens: 1000 }
  );
}

// Content Studio: write a full long-form article plus matching social posts for one topic.
export function writeArticle(topic, businessContext = '') {
  return askJson(
    `Write a complete, publish-ready blog article.

TOPIC: ${topic}
${businessContext ? `\nWrite this for/about the following business - use it for concrete examples and a natural call to action:\n${businessContext}\n` : '\nThis is a general business/startup audience piece - no specific company to promote.\n'}

Write in a practical, specific, non-generic voice for founders and entrepreneurs. Use real reasoning and concrete examples, not vague platitudes.
Also write 3 short social captions that promote this article on Instagram, LinkedIn and X.

Return JSON with exactly this shape:
{
  "title": "a strong, specific headline (sharper than the topic, not identical to it)",
  "metaDescription": "150-160 character SEO meta description",
  "tags": ["5-8 relevant tags"],
  "content": "the full article body in Markdown, 900-1400 words, using ## headings, an intro, 3-5 sections, and a short conclusion with a call to action",
  "posts": [
    { "platform": "instagram", "goal": "", "caption": "", "hashtags": [""] },
    { "platform": "linkedin", "goal": "", "caption": "", "hashtags": [""] },
    { "platform": "x", "goal": "", "caption": "", "hashtags": [""] }
  ]
}
Avoid health or medical cure claims.`,
    { maxTokens: 6000 }
  );
}

// Content Studio: write just a batch of standalone social posts (no full article) for one topic.
export function writePost(topic, businessContext = '') {
  return askJson(
    `Write 3 short, ready-to-publish social media posts about this topic.

TOPIC: ${topic}
${businessContext ? `\nWrite these for/about the following business:\n${businessContext}\n` : '\nGeneral business/startup audience - no specific company to promote.\n'}

One post each for Instagram, LinkedIn and X. Each should stand alone (not require reading an article), be specific and punchy, and fit that platform's tone and length.

Return JSON:
{
  "title": "a short internal label for this batch, a few words",
  "tags": ["3-6 relevant tags"],
  "posts": [
    { "platform": "instagram", "goal": "", "caption": "", "hashtags": [""] },
    { "platform": "linkedin", "goal": "", "caption": "", "hashtags": [""] },
    { "platform": "x", "goal": "", "caption": "", "hashtags": [""] }
  ]
}
Avoid health or medical cure claims.`,
    { maxTokens: 1500 }
  );
}
