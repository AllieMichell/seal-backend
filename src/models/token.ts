import { Schema, model, Document, Types } from "mongoose";

export interface IToken extends Document {
  userId: Types.ObjectId;
  refreshToken: string;
  expiresAt: Date;
}

const tokenSchema = new Schema<IToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    refreshToken: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
);

export const Token = model<IToken>("Token", tokenSchema, "tokens");
