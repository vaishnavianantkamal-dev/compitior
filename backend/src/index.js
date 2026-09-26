import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { connectDB } from './config/db.js';
import analysisRoutes from './routes/analysis.routes.js';
import publicRoutes from './routes/public.routes.js';
import insightsRoutes from './routes/insights.routes.js';
import configRoutes from './routes/config.routes.js';
import Analysis from './models/Analysis.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// New analyses cost Apify + Claude credits, so cap how often they can be started.
const createLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
app.post('/api/analyses', createLimiter);

app.get('/api/health', (req, res) =>
  res.json({
    ok: true,
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    apify: Boolean(process.env.APIFY_TOKEN),
    publishWebhook: Boolean(process.env.PUBLISH_WEBHOOK_URL),
  })
);
app.use('/api/analyses', analysisRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/config', configRoutes);

// Serve the built React app in production
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

async function start() {
  await connectDB();
  // Jobs run in-process; if the server restarted mid-job, mark those jobs failed so the UI isn't stuck.
  const stuck = await Analysis.updateMany(
    { status: { $nin: ['done', 'failed'] } },
    { $set: { status: 'failed', error: 'Server restarted while this analysis was running. Click "Run again".' } }
  );
  if (stuck.modifiedCount) console.log(`Marked ${stuck.modifiedCount} interrupted analyses as failed`);
  app.listen(PORT, () => console.log(`API ready on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
