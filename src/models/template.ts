import { Schema, model, Document, Types } from "mongoose";

// Content types for layout "proposal" (e.g. Fiesta Kids–style documents)
export interface IProposalHeader {
  title: string;
  subtitle?: string;
  proposal?: {
    recipient: string;
    date: string;
    location: string;
  };
  backgroundImage?: string;
  balloonIcon?: string;
}

export interface IProposalAboutUs {
  heading: string;
  description: string;
}

export interface IProposalWorkItem {
  imageUrl: string;
  caption: string;
  icon?: string;
}

export interface IProposalOurWork {
  heading: string;
  items: IProposalWorkItem[];
}

export interface IProposalContent {
  header: IProposalHeader;
  aboutUs: IProposalAboutUs;
  ourWork: IProposalOurWork;
}

export const VALID_LAYOUTS = ["proposal"] as const;
export type TemplateLayout = (typeof VALID_LAYOUTS)[number];

export interface ITemplate extends Document {
  organization_id: Types.ObjectId;
  name: string;
  slug: string | null;
  layout: TemplateLayout;
  content: IProposalContent | Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

const templateSchema = new Schema<ITemplate>(
  {
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    name: { type: String, required: true },
    slug: { type: String, default: null },
    layout: {
      type: String,
      required: true,
      enum: VALID_LAYOUTS,
    },
    content: { type: Schema.Types.Mixed, required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

templateSchema.index({ organization_id: 1, created_at: -1 });
templateSchema.index(
  { organization_id: 1, slug: 1 },
  { unique: true, sparse: true }
);

export const Template = model<ITemplate>(
  "Template",
  templateSchema,
  "templates"
);
