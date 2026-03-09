"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const template_1 = require("../models/template");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
async function renderTemplateHtml(template, res) {
    if (template.layout !== "proposal") {
        res.status(501).json({
            message: `HTML render not supported for layout "${template.layout}".`,
        });
        return;
    }
    res.set("Content-Type", "text/html; charset=utf-8");
    res.render("templates/proposal", { content: template.content });
}
// GET /api/templates/public/:id/html — render HTML (público)
router.get("/public/:id/html", async (req, res) => {
    try {
        const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0] ?? "";
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: "Invalid template ID." });
            return;
        }
        const template = await template_1.Template.findById(id);
        if (!template) {
            res.status(404).json({ message: "Template not found." });
            return;
        }
        await renderTemplateHtml({ layout: template.layout, content: template.content }, res);
    }
    catch (error) {
        res.status(500).json({ message: "Error rendering template", error });
    }
});
// GET /api/templates/public/:id — público, no requiere token
router.get("/public/:id", async (req, res) => {
    try {
        const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0] ?? "";
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: "Invalid template ID." });
            return;
        }
        const template = await template_1.Template.findById(id);
        if (!template) {
            res.status(404).json({ message: "Template not found." });
            return;
        }
        res.json(template);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching template", error });
    }
});
router.use(auth_1.authMiddleware);
// GET /api/templates
router.get("/", async (req, res) => {
    try {
        if (!req.organizationId) {
            res
                .status(403)
                .json({ message: "User is not assigned to an organization." });
            return;
        }
        const { layout, page = "1", limit = "20" } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;
        const filter = {
            organization_id: req.organizationId,
        };
        if (layout && template_1.VALID_LAYOUTS.includes(layout)) {
            filter.layout = layout;
        }
        const [data, total] = await Promise.all([
            template_1.Template.find(filter)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limitNum),
            template_1.Template.countDocuments(filter),
        ]);
        res.json({ data, total, page: pageNum, limit: limitNum });
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching templates", error });
    }
});
// GET /api/templates/:id/html — render HTML (requiere auth)
router.get("/:id/html", async (req, res) => {
    try {
        if (!req.organizationId) {
            res
                .status(403)
                .json({ message: "User is not assigned to an organization." });
            return;
        }
        const template = await template_1.Template.findOne({
            _id: req.params.id,
            organization_id: req.organizationId,
        });
        if (!template) {
            res.status(404).json({ message: "Template not found." });
            return;
        }
        await renderTemplateHtml({ layout: template.layout, content: template.content }, res);
    }
    catch (error) {
        res.status(500).json({ message: "Error rendering template", error });
    }
});
// GET /api/templates/:id
router.get("/:id", async (req, res) => {
    try {
        if (!req.organizationId) {
            res
                .status(403)
                .json({ message: "User is not assigned to an organization." });
            return;
        }
        const template = await template_1.Template.findOne({
            _id: req.params.id,
            organization_id: req.organizationId,
        });
        if (!template) {
            res.status(404).json({ message: "Template not found." });
            return;
        }
        res.json(template);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching template", error });
    }
});
// POST /api/templates
router.post("/", async (req, res) => {
    try {
        if (!req.organizationId) {
            res
                .status(403)
                .json({ message: "User is not assigned to an organization." });
            return;
        }
        const { name, slug, layout, content } = req.body;
        if (!name || !layout || content === undefined) {
            res.status(400).json({
                message: "name, layout, and content are required.",
            });
            return;
        }
        if (!template_1.VALID_LAYOUTS.includes(layout)) {
            res.status(400).json({
                message: `Invalid layout. Must be one of: ${template_1.VALID_LAYOUTS.join(", ")}`,
            });
            return;
        }
        if (slug !== undefined && slug !== null && slug !== "") {
            const existing = await template_1.Template.findOne({
                organization_id: req.organizationId,
                slug,
            });
            if (existing) {
                res.status(400).json({ message: "A template with this slug already exists." });
                return;
            }
        }
        const template = await template_1.Template.create({
            organization_id: req.organizationId,
            name,
            slug: slug ?? null,
            layout,
            content,
        });
        res.status(201).json(template);
    }
    catch (error) {
        res.status(500).json({ message: "Error creating template", error });
    }
});
// PUT /api/templates/:id
router.put("/:id", async (req, res) => {
    try {
        if (!req.organizationId) {
            res
                .status(403)
                .json({ message: "User is not assigned to an organization." });
            return;
        }
        const templateId = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0] ?? "";
        if (!templateId || !mongoose_1.default.Types.ObjectId.isValid(templateId)) {
            res.status(400).json({ message: "Invalid template ID." });
            return;
        }
        const { name, slug, layout, content } = req.body;
        if (layout !== undefined && !template_1.VALID_LAYOUTS.includes(layout)) {
            res.status(400).json({
                message: `Invalid layout. Must be one of: ${template_1.VALID_LAYOUTS.join(", ")}`,
            });
            return;
        }
        if (slug !== undefined && slug !== null && slug !== "") {
            const existing = await template_1.Template.findOne({
                organization_id: req.organizationId,
                slug,
                _id: { $ne: templateId },
            });
            if (existing) {
                res.status(400).json({ message: "A template with this slug already exists." });
                return;
            }
        }
        const updateFields = {};
        if (name !== undefined)
            updateFields.name = name;
        if (slug !== undefined)
            updateFields.slug = slug ?? null;
        if (layout !== undefined)
            updateFields.layout = layout;
        if (content !== undefined)
            updateFields.content = content;
        const template = await template_1.Template.findOneAndUpdate({ _id: templateId, organization_id: req.organizationId }, { $set: updateFields }, { new: true, runValidators: true });
        if (!template) {
            res.status(404).json({ message: "Template not found." });
            return;
        }
        res.json(template);
    }
    catch (error) {
        res.status(500).json({ message: "Error updating template", error });
    }
});
// DELETE /api/templates/:id
router.delete("/:id", async (req, res) => {
    try {
        if (!req.organizationId) {
            res
                .status(403)
                .json({ message: "User is not assigned to an organization." });
            return;
        }
        const template = await template_1.Template.findOneAndDelete({
            _id: req.params.id,
            organization_id: req.organizationId,
        });
        if (!template) {
            res.status(404).json({ message: "Template not found." });
            return;
        }
        res.json({ message: "Template deleted successfully." });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting template", error });
    }
});
exports.default = router;
