import { Request, Response, NextFunction } from "express";
export interface AuthRequest extends Request {
    userId?: string;
    organizationId?: string;
}
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => void;
