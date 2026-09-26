import mongoose from 'mongoose';
import Article from '../models/Article.js';
import Analysis from '../models/Analysis.js';
import { suggestTopics, writeArticle } from '../services/claude.service.js';

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export const topics = wrap(async (req, res) => {
  const seed = typeof req.body.seed === 'string' ? req.body.seed.trim() : '';
  const { topics: list } = await suggestTopics(seed);
  res.json({ topics: list || [] });
});

export const list = wrap(async (req, res) => {
  const docs = await Article.find({}, 'topic title status tags wordCount createdAt')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  res.json(docs);
});

export const getOne = wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Article not found');
  const doc = await Article.findById(req.params.id);
  if (!doc) throw httpError(404, 'Article not found');
  res.json(doc);
});

export const create = wrap(async (req, res) => {
  const topic = typeof req.body.topic === 'string' ? req.body.topic.trim() : '';
  if (!topic || topic.length < 5) throw httpError(400, 'Give the article a topic (at least 5 characters)');

  let analysisId;
  let businessContext = '';
  if (req.body.analysisId && mongoose.isValidObjectId(req.body.analysisId)) {
    const a = await Analysis.findById(req.body.analysisId).lean();
    if (a) {
      analysisId = a._id;
      businessContext = `${a.business.name} - ${a.business.description}${a.report?.summary ? `\nMarket summary: ${a.report.summary}` : ''}`;
    }
  }

  try {
    const result = await writeArticle(topic, businessContext);
    const content = result.content || '';
    const doc = await Article.create({
      topic,
      analysisId,
      businessContext,
      status: 'done',
      title: result.title || topic,
      metaDescription: result.metaDescription || '',
      tags: Array.isArray(result.tags) ? result.tags : [],
      content,
      posts: Array.isArray(result.posts) ? result.posts : [],
      wordCount: content.split(/\s+/).filter(Boolean).length,
    });
    res.status(201).json(doc);
  } catch (err) {
    const doc = await Article.create({ topic, analysisId, businessContext, status: 'failed', error: err.message });
    res.status(502).json(doc);
  }
});

export const remove = wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Article not found');
  const doc = await Article.findById(req.params.id);
  if (!doc) throw httpError(404, 'Article not found');
  await doc.deleteOne();
  res.json({ ok: true });
});

export const markdown = wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Article not found');
  const doc = await Article.findById(req.params.id);
  if (!doc || doc.status !== 'done') throw httpError(400, 'Article is not ready');
  const slug = (doc.title || doc.topic).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${slug || 'article'}.md"`);
  res.send(`# ${doc.title}\n\n${doc.content}`);
});
