/**
 * fixImportsAndValidateAll.js
 * --------------------------------------------
 * Automatically validates and fixes import paths
 * for all navigation + premium screens.
 * Works safely when run from inside /client.
 */

import fs from "fs";
import path from "path";

const ROOT = path.resolve("."); // current /client folder
const SRC = path.join(ROOT, "src");
const NAV_DIR = path.join(ROOT, "navigation");
const SCREENS_DIR = path.join(SRC, "screens");
const MENU_FILE = path.join(SCREENS_DIR, "Menu.pro.js");

const NAV_FILES = [
  "AppNavigator.js",
  "TabsRoot.js",
  "MainTabs.js",
  "PremiumNavigator.js",
];

function listScreens(dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      files = files.concat(listScreens(full));
    } else if (/\.(js|tsx)$/.test(f)) {
      files.push(full.replace(ROOT + "/", ""));
    }
  }
  return files;
}

function fixImports(file, screens) {
  let content = fs.readFileSync(file, "utf8");
  let changed = false;
  let fixed = 0;

  content = content.replace(/from\s+['"](\.{1,2}\/[^\n'"]+)['"]/g, (m, p1) => {
    if (p1.includes("screens")) {
      const base = path.basename(p1).split(".")[0];
      const found = screens.find(
        (s) =>
          s.includes(`${base}.js`) ||
          s.includes(`${base}.tsx`) ||
          s.includes(`${base}.pro.js`) ||
          s.includes(`${base}.real.tsx`)
      );
      if (found && !p1.includes(found)) {
        changed = true;
        fixed++;
        const newPath = "../" + found.replace("src/", "");
        console.log(`✅ ${path.basename(file)} → fixed ${p1} → ${newPath}`);
        return `from "${newPath}"`;
      }
    }
    return m;
  });

  if (changed) fs.writeFileSync(file, content, "utf8");
  return fixed;
}

function main() {
  console.log("🔍 Scanning project structure...");
  if (!fs.existsSync(SCREENS_DIR)) {
    console.error(`❌ Screens folder missing: ${SCREENS_DIR}`);
    process.exit(1);
  }

  const screens = listScreens(SCREENS_DIR);
  console.log(`📂 Found ${screens.length} screen files.\n`);

  const summary = [];

  for (const file of NAV_FILES) {
    const fp = path.join(NAV_DIR, file);
    if (fs.existsSync(fp)) {
      const count = fixImports(fp, screens);
      summary.push({ file, status: count ? `✅ ${count} fixes` : "⚪ No changes" });
    } else {
      summary.push({ file, status: "❌ Missing" });
    }
  }

  if (fs.existsSync(MENU_FILE)) {
    const count = fixImports(MENU_FILE, screens);
    summary.push({ file: "Menu.pro.js", status: count ? `✅ ${count} fixes` : "⚪ No changes" });
  }

  console.log("\n📊 Summary Table");
  console.log("────────────────────────────────────");
  summary.forEach((r) => console.log(`${r.file.padEnd(24)} → ${r.status}`));
  console.log("────────────────────────────────────");
  console.log("\n✅ Import validation complete.\n");
}

main();
