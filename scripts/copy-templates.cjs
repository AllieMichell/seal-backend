const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const srcTemplates = path.join(projectRoot, "src", "templates");
const distTemplates = path.join(projectRoot, "dist", "templates");

if (!fs.existsSync(srcTemplates)) {
  console.warn("scripts/copy-templates.cjs: src/templates not found, skipping.");
  process.exit(0);
}

fs.cpSync(srcTemplates, distTemplates, { recursive: true });
console.log("Copied src/templates to dist/templates");
