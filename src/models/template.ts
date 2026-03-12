import { Schema, model, Document, Types } from "mongoose";

export interface ITemplate extends Document {
  organization_id: Types.ObjectId;
}

const templateSchema = new Schema<ITemplate>({
  organization_id: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
});

templateSchema.index({ organization_id: 1 });

export const Template = model<ITemplate>("Template", templateSchema, "templates");
