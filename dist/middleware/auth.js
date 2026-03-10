"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ message: "Access denied. No token provided." });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.userId = req.headers['x-user-id'] || decoded.userId;
        req.organizationId = req.headers['x-organization-id'] || decoded.organizationId;
        next();
    }
    catch {
        res.status(401).json({ message: "Invalid or expired token." });
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.js.map