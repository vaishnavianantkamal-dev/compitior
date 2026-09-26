import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    platform: String,
    goal: String,
    caption: String,
    hashtags: [String],
  },
  { _id: false }
);

const articleSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true, trim: true, maxlength: 300 },
    analysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Analysis' },
    businessContext: { type: String, trim: true, maxlength: 4000 },
    status: { type: String, enum: ['done', 'failed'], default: 'done', index: true },
    title: { type: String, trim: true, maxlength: 300 },
    metaDescription: { type: String, trim: true, maxlength: 300 },
    tags: [String],
    content: String,
    posts: [postSchema],
    wordCount: Number,
    error: String,
  },
  { timestamps: true }
);

export default mongoose.model('Article', articleSchema);
