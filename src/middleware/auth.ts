import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  organizationId?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Access denied. No token provided." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      organizationId?: string;
    };
    req.userId = (req.headers['x-user-id'] as string) || decoded.userId;
    req.organizationId = (req.headers['x-organization-id'] as string) || decoded.organizationId;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};
