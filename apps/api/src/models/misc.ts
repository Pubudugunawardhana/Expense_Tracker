import { Schema, Types, model } from 'mongoose';

/** Daily cache of USD-based exchange rates. */
export const FxRate = model(
  'FxRate',
  new Schema({
    base: { type: String, required: true, unique: true },
    rates: { type: Map, of: Number, required: true },
    fetchedAt: { type: Date, required: true },
  }),
);

/** AI insights cached per user and month; regenerated when the underlying data changes. */
export const AiInsight = model(
  'AiInsight',
  new Schema(
    {
      userId: { type: Types.ObjectId, ref: 'User', required: true },
      month: { type: String, required: true },
      dataHash: { type: String, required: true },
      insights: [{ _id: false, title: String, body: String, tone: String }],
    },
    { timestamps: true },
  ).index({ userId: 1, month: 1 }, { unique: true }),
);

export const Feedback = model(
  'Feedback',
  new Schema(
    {
      userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
      rating: { type: Number, min: 1, max: 5, required: true },
      message: { type: String, required: true },
    },
    { timestamps: true },
  ),
);
