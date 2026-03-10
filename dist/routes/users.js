"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_1 = require("../models/user");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get("/", async (req, res) => {
    try {
        if (!req.organizationId) {
            res.status(403).json({ message: "Organization context is required." });
            return;
        }
        const users = await user_1.User.find({ organization: req.organizationId }).populate("organization");
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching users", error });
    }
});
router.get("/:id", async (req, res) => {
    try {
        if (!req.organizationId) {
            res.status(403).json({ message: "Organization context is required." });
            return;
        }
        const user = await user_1.User.findOne({
            _id: req.params.id,
            organization: req.organizationId,
        }).populate("organization");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching user", error });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map