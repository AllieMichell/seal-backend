import { Schema, model, Document } from "mongoose";

export interface IOrganization extends Document {
  name: string;
  slug: string;
  settings: {
    theme_color: string;
    custom_domain: string;
  };
  created_at: Date;
}

const organizationSchema = new Schema<IOrganization>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  settings: {
    theme_color: { type: String },
    custom_domain: { type: String },
  },
  created_at: { type: Date, default: Date.now },
});

export const Organization = model<IOrganization>(
  "Organization",
  organizationSchema,
  "organizations"
);
