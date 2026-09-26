const APIFY_BASE = 'https://api.apify.com/v2';

// Runs an Apify actor synchronously and returns its dataset items.
async function runActor(actorId, input, { timeoutSecs = 240 } = {}) {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error('APIFY_TOKEN is missing in server/.env');

  const url = `${APIFY_BASE}/acts/${actorId.replace('/', '~')}/run-sync-get-dataset-items?timeout=${timeoutSecs}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), (timeoutSecs + 30) * 1000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Apify actor ${actorId} failed (${res.status}): ${body.slice(0, 300)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Google search via apify/google-search-scraper.
 * Returns a flat list of organic results: { query, title, url, description }.
 */
export async function googleSearch(queries, { resultsPerPage = 10 } = {}) {
  const items = await runActor('apify/google-search-scraper', {
    queries: queries.join('\n'),
    maxPagesPerQuery: 1,
    resultsPerPage,
    countryCode: (process.env.APIFY_COUNTRY || 'in').toLowerCase(),
    mobileResults: false,
    saveHtml: false,
    saveHtmlToKeyValueStore: false,
  });

  const results = [];
  for (const page of items || []) {
    const query = page?.searchQuery?.term || '';
    for (const r of page?.organicResults || []) {
      if (!r?.url) continue;
      results.push({ query, title: r.title || '', url: r.url, description: r.description || '' });
    }
  }
  return results;
}

/**
 * Crawls competitor websites via apify/website-content-crawler (cheerio mode = cheap + fast).
 * Returns { url, title, description, text } with text trimmed so prompts stay small.
 */
export async function crawlSites(urls, { maxPagesPerSite = 3 } = {}) {
  if (!urls.length) return [];
  const items = await runActor(
    'apify/website-content-crawler',
    {
      startUrls: urls.map((url) => ({ url })),
      crawlerType: 'cheerio',
      maxCrawlDepth: 1,
      maxCrawlPages: urls.length * maxPagesPerSite,
      removeCookieWarnings: true,
      saveMarkdown: false,
      saveHtml: false,
    },
    { timeoutSecs: 300 }
  );

  return (items || []).map((i) => ({
    url: i.url,
    title: i.metadata?.title || '',
    description: i.metadata?.description || '',
    text: (i.text || '').replace(/\s+/g, ' ').slice(0, 3500),
  }));
}
