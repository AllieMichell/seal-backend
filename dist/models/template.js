"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Template = exports.VALID_LAYOUTS = void 0;
const mongoose_1 = require("mongoose");
exports.VALID_LAYOUTS = ["proposal"];
const templateSchema = new mongoose_1.Schema({
    organization_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
    },
    name: { type: String, required: true },
    slug: { type: String, default: null },
    layout: {
        type: String,
        required: true,
        enum: exports.VALID_LAYOUTS,
    },
    content: { type: mongoose_1.Schema.Types.Mixed, required: true },
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});
templateSchema.index({ organization_id: 1, created_at: -1 });
templateSchema.index({ organization_id: 1, slug: 1 }, { unique: true, sparse: true });
exports.Template = (0, mongoose_1.model)("Template", templateSchema, "templates");
