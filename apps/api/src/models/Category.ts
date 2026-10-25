import { Schema, Types, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { CATEGORY_ICONS, TRANSACTION_TYPES } from '@spendly/shared';

const categorySchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    icon: { type: String, enum: CATEGORY_ICONS, required: true },
    color: { type: String, required: true },
  },
  { timestamps: true },
);

categorySchema.index({ userId: 1, type: 1, name: 1 }, { unique: true });

export type CategoryDoc = HydratedDocument<InferSchemaType<typeof categorySchema>>;
export const Category = model('Category', categorySchema);
