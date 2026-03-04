import { Schema, model, Document, Types } from "mongoose";

export interface IQuotationItem {
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
}

export interface IQuotation extends Document {
  organization_id: Types.ObjectId;
  created_by: Types.ObjectId;
  number: string;
  client: string;
  date: Date;
  valid_until: Date | null;
  status: "borrador" | "pendiente" | "aceptada" | "rechazada";
  items: IQuotationItem[];
  general_discount: number;
  tax_rate: number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

const quotationItemSchema = new Schema<IQuotationItem>(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false }
);

const quotationSchema = new Schema<IQuotation>(
  {
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    number: { type: String, required: true },
    client: { type: String, required: true },
    date: { type: Date, required: true },
    valid_until: { type: Date, default: null },
    status: {
      type: String,
      required: true,
      enum: ["borrador", "pendiente", "aceptada", "rechazada"],
      default: "borrador",
    },
    items: {
      type: [quotationItemSchema],
      required: true,
      validate: {
        validator: (v: IQuotationItem[]) => v.length >= 1,
        message: "At least one item is required.",
      },
    },
    general_discount: { type: Number, default: 0, min: 0, max: 100 },
    tax_rate: { type: Number, required: true, default: 16, min: 0 },
    notes: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

quotationSchema.index({ organization_id: 1, number: 1 }, { unique: true });
quotationSchema.index({ organization_id: 1, status: 1 });
quotationSchema.index({ organization_id: 1, created_at: -1 });

export const Quotation = model<IQuotation>(
  "Quotation",
  quotationSchema,
  "quotations"
);
