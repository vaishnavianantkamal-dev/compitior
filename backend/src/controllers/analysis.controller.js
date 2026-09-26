import mongoose from 'mongoose';
import Analysis from '../models/Analysis.js';
import { runPipeline, isRunning } from '../services/pipeline.service.js';
import { publishToWebhook } from '../services/publish.service.js';
import { reportToMarkdown } from '../utils/markdown.js';

const FIELDS = ['name', 'description', 'industry', 'location', 'website', 'targetMarket', 'priceRange', 'knownCompetitors'];

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function findOr404(id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Analysis not found');
  const doc = await Analysis.findById(id);
  if (!doc) throw httpError(404, 'Analysis not found');
  return doc;
}

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

export const create = wrap(async (req, res) => {
  const business = {};
  for (const f of FIELDS) if (typeof req.body[f] === 'string') business[f] = req.body[f].trim();
  if (!business.name || !business.description) throw httpError(400, 'Business name and description are required');
  if (business.description.length < 30) throw httpError(400, 'Describe the business in at least 30 characters so the research has something to work with');

  const doc = await Analysis.create({ business, status: 'queued', stepMessage: 'Waiting to start' });
  runPipeline(doc._id); // background job
  res.status(201).json(doc);
});

export const list = wrap(async (req, res) => {
  const match = {};
  if (req.query.saved === 'true') match.saved = true;

  const docs = await Analysis.aggregate([
    { $match: match },
    { $sort: { createdAt: -1 } },
    { $limit: 100 },
    {
      $project: {
        business: 1,
        status: 1,
        createdAt: 1,
        saved: 1,
        viability: '$report.viability',
        competitorsCount: { $size: { $ifNull: ['$report.competitors', []] } },
        gapsCount: { $size: { $ifNull: ['$report.gaps', []] } },
        recommendationsCount: { $size: { $ifNull: ['$report.recommendations', []] } },
      },
    },
  ]);
  res.json(docs);
});

export const getOne = wrap(async (req, res) => {
  const doc = await findOr404(req.params.id);
  res.json({ ...doc.toObject(), running: isRunning(doc._id) });
});

export const remove = wrap(async (req, res) => {
  const doc = await findOr404(req.params.id);
  if (isRunning(doc._id)) throw httpError(409, 'This analysis is still running. Delete it once it finishes.');
  await doc.deleteOne();
  res.json({ ok: true });
});

export const rerun = wrap(async (req, res) => {
  const doc = await findOr404(req.params.id);
  if (isRunning(doc._id)) throw httpError(409, 'Already running');
  doc.status = 'queued';
  doc.stepMessage = 'Waiting to start';
  doc.error = null;
  await doc.save();
  runPipeline(doc._id);
  res.json(doc);
});

export const markdown = wrap(async (req, res) => {
  const doc = await findOr404(req.params.id);
  if (doc.status !== 'done') throw httpError(400, 'Report is not ready yet');
  const slug = doc.business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${slug || 'report'}-competitor-analysis.md"`);
  res.send(reportToMarkdown(doc));
});

export const share = wrap(async (req, res) => {
  const doc = await findOr404(req.params.id);
  doc.isPublic = Boolean(req.body.isPublic);
  await doc.save();
  res.json({ isPublic: doc.isPublic });
});

export const toggleSave = wrap(async (req, res) => {
  const doc = await findOr404(req.params.id);
  doc.saved = Boolean(req.body.saved);
  await doc.save();
  res.json({ saved: doc.saved });
});

export const publish = wrap(async (req, res) => {
  const doc = await findOr404(req.params.id);
  const index = Number(req.body.postIndex);
  const post = doc.report?.posts?.[index];
  if (!post) throw httpError(400, 'Post not found');

  // The client may send an edited caption.
  const caption = typeof req.body.caption === 'string' && req.body.caption.trim() ? req.body.caption.trim() : post.caption;
  const hashtags = Array.isArray(req.body.hashtags) ? req.body.hashtags : post.hashtags || [];

  const payload = {
    platform: post.platform,
    caption,
    hashtags,
    text: `${caption}\n\n${hashtags.join(' ')}`.trim(),
    business: doc.business.name,
    analysisId: String(doc._id),
  };

  try {
    const message = await publishToWebhook(payload);
    doc.publishLog.push({ platform: post.platform, ok: true, message });
    await doc.save();
    res.json({ ok: true, message });
  } catch (err) {
    doc.publishLog.push({ platform: post.platform, ok: false, message: err.message });
    await doc.save();
    throw err.status ? err : httpError(502, err.message);
  }
});

export const getPublic = wrap(async (req, res) => {
  const doc = await findOr404(req.params.id);
  if (!doc.isPublic || doc.status !== 'done') throw httpError(404, 'This report is private or not ready');
  const { business, report, finishedAt, warnings } = doc.toObject();
  res.json({ _id: doc._id, business, report, finishedAt, warnings, status: 'done' });
});
