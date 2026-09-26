import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeEnvUpdates } from '../utils/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '../../.env');

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

function mask(value) {
  if (!value) return null;
  if (value.length <= 8) return '••••••••';
  return `${value.slice(0, 6)}••••${value.slice(-4)}`;
}

export const get = wrap(async (req, res) => {
  res.json({
    anthropicApiKey: mask(process.env.ANTHROPIC_API_KEY),
    anthropicModel: process.env.ANTHROPIC_MODEL || '',
    apifyToken: mask(process.env.APIFY_TOKEN),
    apifyCountry: process.env.APIFY_COUNTRY || '',
    maxCompetitorsToCrawl: process.env.MAX_COMPETITORS_TO_CRAWL || '',
    publishWebhookUrl: process.env.PUBLISH_WEBHOOK_URL || '',
  });
});

const EDITABLE = {
  anthropicApiKey: 'ANTHROPIC_API_KEY',
  anthropicModel: 'ANTHROPIC_MODEL',
  apifyToken: 'APIFY_TOKEN',
  apifyCountry: 'APIFY_COUNTRY',
  maxCompetitorsToCrawl: 'MAX_COMPETITORS_TO_CRAWL',
  publishWebhookUrl: 'PUBLISH_WEBHOOK_URL',
};

export const update = wrap(async (req, res) => {
  const updates = {};
  for (const [field, envKey] of Object.entries(EDITABLE)) {
    const value = req.body[field];
    // Blank means "leave unchanged" - lets the client submit masked/empty secret fields untouched.
    if (typeof value === 'string' && value.trim() !== '') {
      updates[envKey] = value.trim();
      process.env[envKey] = value.trim();
    }
  }
  writeEnvUpdates(ENV_PATH, updates);
  res.json({ ok: true, updated: Object.keys(updates) });
});
