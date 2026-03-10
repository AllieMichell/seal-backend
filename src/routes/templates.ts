import { Router, Request, Response } from "express";
import fs from "fs/promises";
import path from "path";

const router = Router();

// Solo permitir IDs seguros: alfanuméricos y guiones (evitar path traversal)
const VALID_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

const TEMPLATES_DIR = path.join(__dirname, "..", "templates");

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id.trim() : "";
    if (!id || !VALID_ID_REGEX.test(id)) {
      res.status(400).json({ message: "Invalid template ID." });
      return;
    }

    const filePath = path.join(TEMPLATES_DIR, `${id}.html`);
    const resolvedPath = path.resolve(filePath);
    const resolvedTemplatesDir = path.resolve(TEMPLATES_DIR);

    if (!resolvedPath.startsWith(resolvedTemplatesDir)) {
      res.status(400).json({ message: "Invalid template ID." });
      return;
    }

    const html = await fs.readFile(filePath, "utf-8");
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      res.status(404).json({ message: "Template not found." });
      return;
    }
    res.status(500).json({ message: "Error reading template", error });
  }
});

export default router;
