"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const organization_1 = require("../models/organization");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get("/", async (req, res) => {
    try {
        if (!req.organizationId) {
            res.status(403).json({ message: "Organization context is required." });
            return;
        }
        const organization = await organization_1.Organization.findById(req.organizationId);
        res.json(organization ? [organization] : []);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching organizations", error });
    }
});
router.get("/:id", async (req, res) => {
    try {
        if (req.organizationId && req.params.id !== req.organizationId) {
            res.status(403).json({ message: "Access denied." });
            return;
        }
        const organization = await organization_1.Organization.findById(req.params.id);
        if (!organization) {
            res.status(404).json({ message: "Organization not found" });
            return;
        }
        res.json(organization);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching organization", error });
    }
});
router.post("/", async (req, res) => {
    try {
        const { name, slug, settings } = req.body;
        const resolvedSlug = slug || name.toLowerCase().replace(/\s+/g, "-");
        const organization = await organization_1.Organization.create({
            name,
            slug: resolvedSlug,
            settings,
        });
        res.status(201).json(organization);
    }
    catch (error) {
        res.status(500).json({ message: "Error creating organization", error });
    }
});
router.put("/:id", async (req, res) => {
    try {
        if (req.organizationId && req.params.id !== req.organizationId) {
            res.status(403).json({ message: "Access denied." });
            return;
        }
        const organization = await organization_1.Organization.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!organization) {
            res.status(404).json({ message: "Organization not found" });
            return;
        }
        res.json(organization);
    }
    catch (error) {
        res.status(500).json({ message: "Error updating organization", error });
    }
});
router.delete("/:id", async (req, res) => {
    try {
        if (req.organizationId && req.params.id !== req.organizationId) {
            res.status(403).json({ message: "Access denied." });
            return;
        }
        const organization = await organization_1.Organization.findByIdAndDelete(req.params.id);
        if (!organization) {
            res.status(404).json({ message: "Organization not found" });
            return;
        }
        res.json({ message: "Organization deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting organization", error });
    }
});
exports.default = router;
//# sourceMappingURL=organizations.js.map