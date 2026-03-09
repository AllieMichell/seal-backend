import { Router, Response } from "express";
import { Organization } from "../models/organization";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.organizationId) {
      res.status(403).json({ message: "Organization context is required." });
      return;
    }
    const organization = await Organization.findById(req.organizationId);
    res.json(organization ? [organization] : []);
  } catch (error) {
    res.status(500).json({ message: "Error fetching organizations", error });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (req.organizationId && req.params.id !== req.organizationId) {
      res.status(403).json({ message: "Access denied." });
      return;
    }
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      res.status(404).json({ message: "Organization not found" });
      return;
    }
    res.json(organization);
  } catch (error) {
    res.status(500).json({ message: "Error fetching organization", error });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, settings } = req.body;

    const resolvedSlug =
      slug || name.toLowerCase().replace(/\s+/g, "-");

    const organization = await Organization.create({
      name,
      slug: resolvedSlug,
      settings,
    });

    res.status(201).json(organization);
  } catch (error) {
    res.status(500).json({ message: "Error creating organization", error });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (req.organizationId && req.params.id !== req.organizationId) {
      res.status(403).json({ message: "Access denied." });
      return;
    }
    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!organization) {
      res.status(404).json({ message: "Organization not found" });
      return;
    }
    res.json(organization);
  } catch (error) {
    res.status(500).json({ message: "Error updating organization", error });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (req.organizationId && req.params.id !== req.organizationId) {
      res.status(403).json({ message: "Access denied." });
      return;
    }
    const organization = await Organization.findByIdAndDelete(req.params.id);
    if (!organization) {
      res.status(404).json({ message: "Organization not found" });
      return;
    }
    res.json({ message: "Organization deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting organization", error });
  }
});

export default router;
