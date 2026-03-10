"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const user_1 = require("../models/user");
const token_1 = require("../models/token");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
function generateAccessToken(userId, organizationId) {
    return jsonwebtoken_1.default.sign({ userId, organizationId }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });
}
async function generateRefreshToken(userId) {
    const refreshToken = crypto_1.default.randomBytes(40).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await token_1.Token.create({ userId, refreshToken, expiresAt });
    return refreshToken;
}
router.post("/register", async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        const existingUser = await user_1.User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "Email already registered." });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await user_1.User.create({
            name,
            email,
            phone,
            password: hashedPassword,
        });
        const userId = user._id.toString();
        const accessToken = generateAccessToken(userId, user.organization?.toString());
        const refreshToken = await generateRefreshToken(userId);
        res.status(201).json({ accessToken, refreshToken });
    }
    catch (error) {
        res.status(500).json({ message: "Error registering user", error });
    }
});
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await user_1.User.findOne({ email });
        if (!user) {
            res.status(401).json({ message: "Invalid email or password." });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: "Invalid email or password." });
            return;
        }
        const userId = user._id.toString();
        const accessToken = generateAccessToken(userId, user.organization?.toString());
        const refreshToken = await generateRefreshToken(userId);
        res.json({ accessToken, refreshToken });
    }
    catch (error) {
        res.status(500).json({ message: "Error logging in", error });
    }
});
router.post("/refresh", async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ message: "Refresh token is required." });
            return;
        }
        const storedToken = await token_1.Token.findOne({ refreshToken });
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
        const user = await user_1.User.findById(storedToken.userId);
        const accessToken = generateAccessToken(storedToken.userId.toString(), user?.organization?.toString());
        const newRefreshToken = await generateRefreshToken(storedToken.userId.toString());
        res.json({ accessToken, refreshToken: newRefreshToken });
    }
    catch (error) {
        res.status(500).json({ message: "Error refreshing token", error });
    }
});
router.post("/logout", auth_1.authMiddleware, async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await token_1.Token.findOneAndDelete({ refreshToken, userId: req.userId });
        }
        else {
            await token_1.Token.deleteMany({ userId: req.userId });
        }
        res.json({ message: "Logged out successfully." });
    }
    catch (error) {
        res.status(500).json({ message: "Error logging out", error });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map