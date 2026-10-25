import { Schema, Types, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const budgetSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    /** `YYYY-MM` */
    month: { type: String, required: true },
    total: { type: Number, default: 0, min: 0 },
    /** categoryId → amount */
    categories: { type: Map, of: Number, default: {} },
  },
  // v1 used the `budgets` collection with a unique userId index, so keep this separate.
  { timestamps: true, collection: 'monthlybudgets' },
);

budgetSchema.index({ userId: 1, month: 1 }, { unique: true });

export type BudgetDoc = HydratedDocument<InferSchemaType<typeof budgetSchema>>;
export const Budget = model('Budget', budgetSchema);
