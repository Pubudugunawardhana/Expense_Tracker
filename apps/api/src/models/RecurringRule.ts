import { Schema, Types, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { CURRENCIES, RECURRING_FREQUENCIES, TRANSACTION_TYPES } from '@spendly/shared';

const recurringRuleSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: CURRENCIES, required: true },
    categoryId: { type: Types.ObjectId, ref: 'Category', required: true },
    frequency: { type: String, enum: RECURRING_FREQUENCIES, required: true },
    startDate: { type: String, required: true },
    /** Next `YYYY-MM-DD` on which a transaction should be created. */
    nextRun: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

recurringRuleSchema.index({ active: 1, nextRun: 1 });

export type RecurringRuleDoc = HydratedDocument<InferSchemaType<typeof recurringRuleSchema>>;
export const RecurringRule = model('RecurringRule', recurringRuleSchema);
