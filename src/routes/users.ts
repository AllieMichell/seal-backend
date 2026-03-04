import { Router, Response } from "express";
import { User } from "../models/user";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().populate("organization");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id).populate("organization");
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
