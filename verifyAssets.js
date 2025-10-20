import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const assetRegex = /require\(['"](.+?\.(png|jpg|jpeg|gif|mp4))['"]\)/g;

function scanDir(dir) {
  const results = [];
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...scanDir(fullPath));
    } else if (/\.(js|jsx|ts|tsx)$/.test(item)) {
      const content = fs.readFileSync(fullPath, "utf8");
      let match;
      while ((match = assetRegex.exec(content))) {
        results.push({ file: fullPath, asset: match[1] });
      }
    }
  }
  return results;
}

const allRefs = scanDir(path.join(projectRoot, "src/screens"));
let missing = [];

for (const { file, asset } of allRefs) {
  const resolved = path.resolve(path.join(path.dirname(file), asset));
  if (!fs.existsSync(resolved)) {
    missing.push({ file, asset });
  }
}

if (missing.length) {
  console.log("\n⚠️ Missing assets found:");
  missing.forEach((m) => console.log(`→ ${m.asset} (referenced in ${m.file})`));
} else {
  console.log("\n✅ All asset references resolved successfully!");
}
