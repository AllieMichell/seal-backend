import { Router, Response } from "express";
import { Quotation } from "../models/quotation";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

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
