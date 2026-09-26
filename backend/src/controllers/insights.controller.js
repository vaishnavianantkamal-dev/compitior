import mongoose from 'mongoose';
import Analysis from '../models/Analysis.js';
import ManualCompetitor from '../models/ManualCompetitor.js';

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Flattens every competitor found across all completed analyses, plus manually added ones,
// into one list, tagged with which business's research surfaced it.
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
        manual: false,
      });
    }
  }

  const manual = await ManualCompetitor.find().sort({ createdAt: -1 }).lean();
  for (const m of manual) {
    rows.push({
      name: m.name,
      url: m.url,
      region: m.region,
      type: 'direct',
      positioning: m.positioning,
      pricing: m.pricing,
      threatLevel: m.threatLevel,
      manualId: m._id,
      sourceBusiness: 'Manually added',
      sourceIndustry: m.industry,
      foundAt: m.createdAt,
      manual: true,
    });
  }

  res.json(rows);
});

export const addCompetitor = wrap(async (req, res) => {
  const { name, url, industry, region, positioning, pricing, threatLevel, notes } = req.body;
  if (!name || !name.trim()) throw httpError(400, 'Name is required');
  const doc = await ManualCompetitor.create({
    name: name.trim(),
    url: url?.trim(),
    industry: industry?.trim(),
    region: ['home', 'international'].includes(region) ? region : 'home',
    positioning: positioning?.trim(),
    pricing: pricing?.trim(),
    threatLevel: ['high', 'medium', 'low'].includes(threatLevel) ? threatLevel : 'medium',
    notes: notes?.trim(),
  });
  res.status(201).json(doc);
});

export const removeCompetitor = wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Not found');
  const doc = await ManualCompetitor.findById(req.params.id);
  if (!doc) throw httpError(404, 'Not found');
  await doc.deleteOne();
  res.json({ ok: true });
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
