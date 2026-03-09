"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Quotation = void 0;
const mongoose_1 = require("mongoose");
const quotationItemSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
}, { _id: false });
const quotationSchema = new mongoose_1.Schema({
    organization_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
    },
    created_by: {
        type: mongoose_1.Schema.Types.ObjectId,
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
            validator: (v) => v.length >= 1,
            message: "At least one item is required.",
        },
    },
    general_discount: { type: Number, default: 0, min: 0, max: 100 },
    tax_rate: { type: Number, required: true, default: 16, min: 0 },
    notes: { type: String, default: null },
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});
quotationSchema.index({ organization_id: 1, number: 1 }, { unique: true });
quotationSchema.index({ organization_id: 1, status: 1 });
quotationSchema.index({ organization_id: 1, created_at: -1 });
exports.Quotation = (0, mongoose_1.model)("Quotation", quotationSchema, "quotations");
