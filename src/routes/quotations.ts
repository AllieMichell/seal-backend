import { Router, Response, Request } from "express";
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import { Quotation, IQuotation, IQuotationItem } from "../models/quotation";
import { Template } from "../models/template";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

const TEMPLATES_DIR = path.join(__dirname, "..", "templates");
const VALID_TEMPLATE_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const RAW_HTML_KEYS = new Set(["itemsHtml"]);

function replaceTemplatePlaceholders(
  html: string,
  vars: Record<string, string>
): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = vars[key];
    if (value === undefined) return "";
    return RAW_HTML_KEYS.has(key) ? value : escapeHtml(value);
  });
}

function formatMxn(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function buildItemsHtml(items: IQuotationItem[]): string {
  return items
    .map((item) => {
      const lineTotal =
        item.quantity * item.unit_price * (1 - (item.discount || 0) / 100);
      const unitFormatted = formatMxn(item.unit_price);
      const lineFormatted = formatMxn(lineTotal);
      const title = escapeHtml(item.name);
      const desc = escapeHtml(item.description || "");
      const qty = escapeHtml(String(item.quantity));
      return `<div class="quote-item">
        <div class="quote-item__left">
          <p class="quote-item__title">${title}</p>
          <p class="quote-item__desc">${desc}</p>
          <div class="quote-item__detail">
            <span class="quote-item__qty">${qty} x</span>
            <span> </span>
            <span>${unitFormatted}</span>
          </div>
        </div>
        <div class="quote-item__price">${lineFormatted}</div>
      </div>`;
    })
    .join("\n      ");
}

function formatDateLocale(d: Date | null | undefined): string {
  if (d == null) return "";
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function buildTemplateVars(quotation: IQuotation): Record<string, string> {
  const dateStr = formatDateLocale(quotation.date);
  const validUntilStr = formatDateLocale(quotation.valid_until ?? null);

  const items = quotation.items || [];
  const itemsHtml = buildItemsHtml(items);

  const subtotalBeforeDiscount = items.reduce(
    (sum, item) =>
      sum +
      item.quantity * item.unit_price * (1 - (item.discount || 0) / 100),
    0
  );
  const subtotal =
    subtotalBeforeDiscount * (1 - (quotation.general_discount || 0) / 100);
  const iva = subtotal * ((quotation.tax_rate || 0) / 100);
  const total = subtotal + iva;
  const taxRate = quotation.tax_rate ?? 16;

  return {
    client: quotation.client,
    number: quotation.number,
    date: dateStr,
    valid_until: validUntilStr,
    location: quotation.notes ?? "",
    itemsHtml,
    subtotal: formatMxn(subtotal),
    iva: formatMxn(iva),
    total: formatMxn(total),
    tax_rate: String(taxRate),
  };
}

async function readTemplateHtml(templateId: string): Promise<string> {
  const filePath = path.join(TEMPLATES_DIR, `${templateId}.html`);
  const resolvedPath = path.resolve(filePath);
  const resolvedTemplatesDir = path.resolve(TEMPLATES_DIR);
  if (!resolvedPath.startsWith(resolvedTemplatesDir) || !VALID_TEMPLATE_ID_REGEX.test(templateId)) {
    throw new Error("Invalid template ID");
  }
  return fs.readFile(filePath, "utf-8");
}

// GET /api/quotations/public/:id — público, no requiere token
router.get("/public/:id", async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0] ?? "";
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid quotation ID." });
      return;
    }
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      res.status(404).json({ message: "Quotation not found." });
      return;
    }
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: "Error fetching quotation", error });
  }
});

// GET /api/quotations/public/:id/template — público, devuelve el HTML del template de la cotización
router.get("/public/:id/template", async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0] ?? "";
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid quotation ID." });
      return;
    }
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      res.status(404).json({ message: "Quotation not found." });
      return;
    }
    let templateId = quotation.template_id?.trim();

    if (!templateId) {
      const orgTemplate = await Template.findOne({
        organization_id: quotation.organization_id,
      });
      if (orgTemplate) {
        templateId = orgTemplate._id.toString();
      }
    }

    if (!templateId) {
      res.status(404).json({ message: "No template found." });
      return;
    }
    const html = await readTemplateHtml(templateId);
    const vars = buildTemplateVars(quotation);
    const filledHtml = replaceTemplatePlaceholders(html, vars);
    res.setHeader("Content-Type", "text/html");
    res.send(filledHtml);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT") {
      res.status(404).json({ message: "Template not found." });
      return;
    }
    if (error instanceof Error && error.message === "Invalid template ID") {
      res.status(400).json({ message: "Invalid template ID." });
      return;
    }
    res.status(500).json({ message: "Error reading template", error });
  }
});

router.use(authMiddleware);

const VALID_STATUSES = ["borrador", "pendiente", "aceptada", "rechazada"];

async function generateQuotationNumber(
  organizationId: string
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `COT-${year}-`;
  const last = await Quotation.findOne(
    { organization_id: organizationId, number: { $regex: `^${prefix}` } },
    { number: 1 },
    { sort: { number: -1 } }
  );
  const seq = last ? parseInt(last.number.split("-")[2]) + 1 : 1;
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

// GET /api/quotations
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.organizationId) {
      res
        .status(403)
        .json({ message: "User is not assigned to an organization." });
      return;
    }

    const { status, page = "1", limit = "20" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = {
      organization_id: req.organizationId,
    };
    if (status && VALID_STATUSES.includes(status as string)) {
      filter.status = status;
    }

    const [data, total] = await Promise.all([
      Quotation.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum),
      Quotation.countDocuments(filter),
    ]);

    res.json({ data, total, page: pageNum, limit: limitNum });
  } catch (error) {
    res.status(500).json({ message: "Error fetching quotations", error });
  }
});

// GET /api/quotations/:id
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.organizationId) {
      res
        .status(403)
        .json({ message: "User is not assigned to an organization." });
      return;
    }

    const quotation = await Quotation.findOne({
      _id: req.params.id,
      organization_id: req.organizationId,
    });

    if (!quotation) {
      res.status(404).json({ message: "Quotation not found." });
      return;
    }

    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: "Error fetching quotation", error });
  }
});

// POST /api/quotations
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.organizationId) {
      res
        .status(403)
        .json({ message: "User is not assigned to an organization." });
      return;
    }

    const { client, date, items, tax_rate, valid_until, general_discount, notes } =
      req.body;

    if (!client || !date || !items || !Array.isArray(items) || items.length < 1) {
      res
        .status(400)
        .json({ message: "client, date, and at least one item are required." });
      return;
    }

    const number = await generateQuotationNumber(req.organizationId);

    const quotation = await Quotation.create({
      organization_id: req.organizationId,
      created_by: req.userId,
      number,
      client,
      date,
      valid_until: valid_until ?? null,
      status: "borrador",
      items,
      general_discount: general_discount ?? 0,
      tax_rate: tax_rate ?? 16,
      notes: notes ?? null,
    });

    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ message: "Error creating quotation", error });
  }
});

// PUT /api/quotations/:id
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.organizationId) {
      res
        .status(403)
        .json({ message: "User is not assigned to an organization." });
      return;
    }

    const { client, date, items, tax_rate, valid_until, general_discount, notes, status } =
      req.body;

    if (status && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` });
      return;
    }

    const updateFields: Record<string, unknown> = {};
    if (client !== undefined) updateFields.client = client;
    if (date !== undefined) updateFields.date = date;
    if (items !== undefined) updateFields.items = items;
    if (tax_rate !== undefined) updateFields.tax_rate = tax_rate;
    if (valid_until !== undefined) updateFields.valid_until = valid_until;
    if (general_discount !== undefined) updateFields.general_discount = general_discount;
    if (notes !== undefined) updateFields.notes = notes;
    if (status !== undefined) updateFields.status = status;

    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.id, organization_id: req.organizationId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!quotation) {
      res.status(404).json({ message: "Quotation not found." });
      return;
    }

    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: "Error updating quotation", error });
  }
});

// PATCH /api/quotations/:id/status
router.patch("/:id/status", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.organizationId) {
      res
        .status(403)
        .json({ message: "User is not assigned to an organization." });
      return;
    }

    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      res.status(400).json({
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
      return;
    }

    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.id, organization_id: req.organizationId },
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!quotation) {
      res.status(404).json({ message: "Quotation not found." });
      return;
    }

    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: "Error updating quotation status", error });
  }
});

// DELETE /api/quotations/:id
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.organizationId) {
      res
        .status(403)
        .json({ message: "User is not assigned to an organization." });
      return;
    }

    const quotation = await Quotation.findOneAndDelete({
      _id: req.params.id,
      organization_id: req.organizationId,
    });

    if (!quotation) {
      res.status(404).json({ message: "Quotation not found." });
      return;
    }

    res.json({ message: "Quotation deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting quotation", error });
  }
});

export default router;
