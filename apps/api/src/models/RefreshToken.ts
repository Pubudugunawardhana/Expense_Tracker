import { Schema, Types, model } from 'mongoose';

const refreshTokenSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    // TTL index: MongoDB removes the document once it expires.
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

export const RefreshToken = model('RefreshToken', refreshTokenSchema);
