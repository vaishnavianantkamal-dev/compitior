import mongoose from 'mongoose';

const manualCompetitorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    url: { type: String, trim: true, maxlength: 300 },
    industry: { type: String, trim: true, maxlength: 120 },
    region: { type: String, enum: ['home', 'international'], default: 'home' },
    positioning: { type: String, trim: true, maxlength: 300 },
    pricing: { type: String, trim: true, maxlength: 150 },
    threatLevel: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

export default mongoose.model('ManualCompetitor', manualCompetitorSchema);
