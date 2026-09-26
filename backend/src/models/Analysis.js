import mongoose from 'mongoose';

export const STEPS = ['queued', 'planning', 'searching', 'selecting', 'crawling', 'analyzing', 'done'];

const businessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    industry: { type: String, trim: true, maxlength: 120 },
    location: { type: String, trim: true, maxlength: 120 },
    website: { type: String, trim: true, maxlength: 300 },
    targetMarket: { type: String, trim: true, maxlength: 500 },
    priceRange: { type: String, trim: true, maxlength: 200 },
    knownCompetitors: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: false }
);

const publishLogSchema = new mongoose.Schema(
  {
    platform: String,
    ok: Boolean,
    message: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    business: { type: businessSchema, required: true },
    status: { type: String, enum: [...STEPS, 'failed'], default: 'queued', index: true },
    stepMessage: String,
    plan: mongoose.Schema.Types.Mixed,
    searchResults: [mongoose.Schema.Types.Mixed],
    competitorsFound: [mongoose.Schema.Types.Mixed],
    crawled: [mongoose.Schema.Types.Mixed],
    report: mongoose.Schema.Types.Mixed,
    warnings: [String],
    error: String,
    isPublic: { type: Boolean, default: false },
    saved: { type: Boolean, default: false, index: true },
    publishLog: [publishLogSchema],
    startedAt: Date,
    finishedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Analysis', analysisSchema);
