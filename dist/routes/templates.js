"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
// Solo permitir IDs seguros: alfanuméricos y guiones (evitar path traversal)
const VALID_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const TEMPLATES_DIR = path_1.default.join(__dirname, "..", "templates");
router.get("/:id", async (req, res) => {
    try {
        const id = typeof req.params.id === "string" ? req.params.id.trim() : "";
        if (!id || !VALID_ID_REGEX.test(id)) {
            res.status(400).json({ message: "Invalid template ID." });
            return;
        }
        const filePath = path_1.default.join(TEMPLATES_DIR, `${id}.html`);
        const resolvedPath = path_1.default.resolve(filePath);
        const resolvedTemplatesDir = path_1.default.resolve(TEMPLATES_DIR);
        if (!resolvedPath.startsWith(resolvedTemplatesDir)) {
            res.status(400).json({ message: "Invalid template ID." });
            return;
        }
        const html = await promises_1.default.readFile(filePath, "utf-8");
        res.setHeader("Content-Type", "text/html");
        res.send(html);
    }
    catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
            res.status(404).json({ message: "Template not found." });
            return;
        }
        res.status(500).json({ message: "Error reading template", error });
    }
});
exports.default = router;
//# sourceMappingURL=templates.js.map