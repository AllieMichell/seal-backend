import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/user";
import { Token } from "../models/token";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

function generateAccessToken(userId: string, organizationId?: string): string {
  return jwt.sign({ userId, organizationId }, process.env.JWT_SECRET!, {
    expiresIn: "1h",
  });
}

async function generateRefreshToken(userId: string): Promise<string> {
  const refreshToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await Token.create({ userId, refreshToken, expiresAt });

  return refreshToken;
}

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "Email already registered." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    const userId = user._id.toString();
    const accessToken = generateAccessToken(
      userId,
      user.organization?.toString()
    );
    const refreshToken = await generateRefreshToken(userId);

    res.status(201).json({ accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    const userId = user._id.toString();
    const accessToken = generateAccessToken(
      userId,
      user.organization?.toString()
    );
    const refreshToken = await generateRefreshToken(userId);

    res.json({ accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
});

router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ message: "Refresh token is required." });
      return;
    }

    const storedToken = await Token.findOne({ refreshToken });
    if (!storedToken) {
      res.status(401).json({ message: "Invalid refresh token." });
      return;
    }

    if (storedToken.expiresAt < new Date()) {
      await storedToken.deleteOne();
      res.status(401).json({ message: "Refresh token expired." });
      return;
    }

    await storedToken.deleteOne();

    const user = await User.findById(storedToken.userId);
    const accessToken = generateAccessToken(
      storedToken.userId.toString(),
      user?.organization?.toString()
    );
    const newRefreshToken = await generateRefreshToken(
      storedToken.userId.toString()
    );

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(500).json({ message: "Error refreshing token", error });
  }
});

router.post("/logout", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await Token.findOneAndDelete({ refreshToken, userId: req.userId });
    } else {
      await Token.deleteMany({ userId: req.userId });
    }

    res.json({ message: "Logged out successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error logging out", error });
  }
});

export default router;
