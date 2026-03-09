import { Router, Response } from "express";
import { User } from "../models/user";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.organizationId) {
      res.status(403).json({ message: "Organization context is required." });
      return;
    }
    const users = await User.find({ organization: req.organizationId }).populate("organization");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.organizationId) {
      res.status(403).json({ message: "Organization context is required." });
      return;
    }
    const user = await User.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    }).populate("organization");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
});

export default router;
