import { Schema, Types, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { CURRENCIES, TRANSACTION_TYPES } from '@spendly/shared';

const transactionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: CURRENCIES, required: true },
    /** `amount` converted to the owner's base currency when saved. */
    baseAmount: { type: Number, required: true },
    categoryId: { type: Types.ObjectId, ref: 'Category', required: true },
    /** Local calendar date as `YYYY-MM-DD`, so month ranges compare as strings. */
    date: { type: String, required: true },
    note: { type: String, default: '' },
    recurringId: { type: Types.ObjectId, ref: 'RecurringRule', default: null },
  },
  { timestamps: true },
);

transactionSchema.index({ userId: 1, date: -1, createdAt: -1 });
transactionSchema.index({ userId: 1, categoryId: 1 });

export type TransactionDoc = HydratedDocument<InferSchemaType<typeof transactionSchema>>;
export const Transaction = model('Transaction', transactionSchema);
