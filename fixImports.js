import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const includeDirs = ["client/src", "client/navigation"]; // only scan these
const replaceMap = {
  "src/navigation": "client/navigation",
  "src/screens": "client/src/screens",
  "src/context": "client/src/context",
  "src/theme": "client/src/theme",
};

const exts = [".js", ".jsx", ".tsx", ".ts"];

function fixImportsInFile(filePath) {
  let text = fs.readFileSync(filePath, "utf8");
  let changed = false;
  for (const [oldPath, newPath] of Object.entries(replaceMap)) {
    if (text.includes(oldPath)) {
      text = text.replaceAll(oldPath, newPath);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, text, "utf8");
    console.log(`✅ Fixed imports in: ${filePath}`);
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip node_modules and other junk
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      walk(full);
    } else if (exts.some(e => entry.name.endsWith(e))) {
      fixImportsInFile(full);
    }
  }
}

console.log("🔍 Scanning for import path issues...");
for (const d of includeDirs) {
  const abs = path.join(rootDir, d);
  if (fs.existsSync(abs)) walk(abs);
}
console.log("🎉 Import paths updated successfully!");
