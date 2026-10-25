import bcrypt from 'bcryptjs';
import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { CURRENCIES, DEFAULT_CURRENCY } from '@spendly/shared';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    /** Absent for accounts created with Google. */
    password: { type: String, select: false },
    googleId: { type: String, index: { unique: true, sparse: true } },
    avatar: { type: String, default: null },
    baseCurrency: { type: String, enum: CURRENCIES, default: DEFAULT_CURRENCY },
    isDemo: { type: Boolean, default: false },
    resetPasswordTokenHash: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;

export const comparePassword = (user: UserDoc, candidate: string) =>
  user.password ? bcrypt.compare(candidate, user.password) : Promise.resolve(false);

export const User = model('User', userSchema);
