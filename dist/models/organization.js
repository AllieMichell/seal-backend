"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Organization = void 0;
const mongoose_1 = require("mongoose");
const organizationSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    settings: {
        theme_color: { type: String },
        custom_domain: { type: String },
    },
    created_at: { type: Date, default: Date.now },
});
exports.Organization = (0, mongoose_1.model)("Organization", organizationSchema, "organizations");
