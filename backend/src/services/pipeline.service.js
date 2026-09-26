import Analysis from '../models/Analysis.js';
import { googleSearch, crawlSites } from './apify.service.js';
import { planResearch, selectCompetitors, writeReport } from './claude.service.js';
import { hostnameOf } from '../utils/json.js';

const running = new Set();

async function setStep(id, status, stepMessage, extra = {}) {
  await Analysis.findByIdAndUpdate(id, { $set: { status, stepMessage, ...extra } });
}

function dedupeByHost(results) {
  const seen = new Set();
  return results.filter((r) => {
    const key = `${hostnameOf(r.url)}|${r.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function isRunning(id) {
  return running.has(String(id));
}

export async function runPipeline(id) {
  const key = String(id);
  if (running.has(key)) return;
  running.add(key);
  const warnings = [];

  try {
    const doc = await Analysis.findById(id);
    if (!doc) return;
    const business = doc.business.toObject();

    await setStep(id, 'planning', 'Understanding the business and planning searches', {
      startedAt: new Date(), error: null, report: null, warnings: [],
    });
    const plan = await planResearch(business);
    const queries = (plan.searchQueries || []).slice(0, 8);
    if (!queries.length) throw new Error('Could not build search queries for this business');

    await setStep(id, 'searching', `Searching Google for ${queries.length} queries`, { plan });
    const searchResults = dedupeByHost(await googleSearch(queries));
    if (!searchResults.length) throw new Error('Google search returned no results. Check your Apify token and credits.');

    await setStep(id, 'selecting', `Picking competitors from ${searchResults.length} results`, {
      searchResults: searchResults.slice(0, 120),
    });
    const selection = await selectCompetitors(business, searchResults);
    const competitors = (selection.competitors || []).filter((c) => c.url);
    if (selection.notInResults?.length) {
      warnings.push(`Expected but not found in search: ${selection.notInResults.join(', ')}`);
    }

    const maxCrawl = Number(process.env.MAX_COMPETITORS_TO_CRAWL || 6);
    const toCrawl = competitors.filter((c) => c.channel !== 'marketplace').slice(0, maxCrawl).map((c) => c.url);

    await setStep(id, 'crawling', `Reading ${toCrawl.length} competitor websites`, { competitorsFound: competitors });
    let crawled = [];
    try {
      crawled = await crawlSites(toCrawl);
    } catch (err) {
      // Report can still be written from search snippets.
      warnings.push(`Website crawl failed, report uses search snippets only: ${err.message}`);
    }

    await setStep(id, 'analyzing', 'Writing the report, suggestions and posts', {
      crawled: crawled.map(({ url, title, description }) => ({ url, title, description })),
    });
    const report = await writeReport(business, plan, competitors, crawled, searchResults);

    await setStep(id, 'done', 'Report ready', { report, warnings, finishedAt: new Date() });
  } catch (err) {
    console.error(`Pipeline ${key} failed:`, err);
    await setStep(id, 'failed', 'Failed', { error: err.message, warnings, finishedAt: new Date() });
  } finally {
    running.delete(key);
  }
}
