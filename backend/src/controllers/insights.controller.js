import Analysis from '../models/Analysis.js';

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// Flattens every competitor found across all completed analyses into one list,
// tagged with which business's research surfaced it.
export const competitors = wrap(async (req, res) => {
  const docs = await Analysis.find(
    { status: 'done', 'report.competitors.0': { $exists: true } },
    'business.name business.industry business.location report.competitors createdAt'
  )
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const rows = [];
  for (const d of docs) {
    for (const c of d.report.competitors || []) {
      rows.push({
        ...c,
        analysisId: d._id,
        sourceBusiness: d.business.name,
        sourceIndustry: d.business.industry,
        sourceLocation: d.business.location,
        foundAt: d.createdAt,
      });
    }
  }
  res.json(rows);
});

// Aggregate stats + market trends/gaps across all completed analyses, for the Market Insights page.
export const summary = wrap(async (req, res) => {
  const docs = await Analysis.find(
    { status: 'done' },
    'business.name business.industry business.location report.viability report.market report.gaps report.competitors createdAt'
  )
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const scores = docs.map((d) => d.report?.viability?.score).filter((n) => typeof n === 'number');
  const stats = {
    totalAnalyses: docs.length,
    avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    totalCompetitors: docs.reduce((sum, d) => sum + (d.report?.competitors?.length || 0), 0),
    totalGaps: docs.reduce((sum, d) => sum + (d.report?.gaps?.length || 0), 0),
  };

  const markets = docs
    .filter((d) => d.report?.market || d.report?.gaps?.length)
    .map((d) => ({
      analysisId: d._id,
      business: d.business.name,
      industry: d.business.industry,
      location: d.business.location,
      score: d.report?.viability?.score ?? null,
      overview: d.report?.market?.overview || '',
      trends: d.report?.market?.trends || [],
      gaps: d.report?.gaps || [],
      createdAt: d.createdAt,
    }));

  res.json({ stats, markets });
});
