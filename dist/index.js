"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const users_1 = __importDefault(require("./routes/users"));
const auth_1 = __importDefault(require("./routes/auth"));
const organizations_1 = __importDefault(require("./routes/organizations"));
const quotations_1 = __importDefault(require("./routes/quotations"));
const templates_1 = __importDefault(require("./routes/templates"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("MONGODB_URI is not defined in environment variables");
    process.exit(1);
}
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.set("view engine", "ejs");
app.set("views", path_1.default.join(process.cwd(), "views"));
app.get("/", (_req, res) => {
    res.status(200).json({ status: "ok", message: "Seal Backend API" });
});
app.use("/api/auth", auth_1.default);
app.use("/api/users", users_1.default);
app.use("/api/organizations", organizations_1.default);
app.use("/api/quotations", quotations_1.default);
app.use("/api/templates", templates_1.default);
mongoose_1.default
    .connect(MONGODB_URI)
    .then(() => {
    console.log("Connected to MongoDB Atlas");
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
    .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
});
