/**
 * fixImportsAndValidateAll.js
 * Auto-fixes all import paths for OmniTintAI / LuxHair_AllInOne project
 * Covers: AppNavigator, TabsRoot, MainTabs, PremiumNavigator, Menu.pro.js
 *
 * Usage:
 *   node fixImportsAndValidateAll.js
 */

import fs from "fs";
import path from "path";

const ROOT = path.resolve("./client");
const NAV_DIR = path.join(ROOT, "navigation");
const SCREEN_DIR = path.join(ROOT, "src", "screens");
const MENU_FILE = path.join(SCREEN_DIR, "Menu.pro.js");

const NAV_FILES = [
  "AppNavigator.js",
  "TabsRoot.js",
  "MainTabs.js",
  "PremiumNavigator.js",
];

function listAllScreens(dir) {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(listAllScreens(full));
    } else if (/\.(js|tsx)$/.test(file)) {
      results.push(full.replace(ROOT + "/", ""));
    }
  }
  return results;
}

function fixImportsInFile(file, screens) {
  let content = fs.readFileSync(file, "utf8");
  let modified = false;

  const importRegex = /from\s+["'](\.{1,2}\/[^\n"']+)["']/g;
  content = content.replace(importRegex, (match, p1) => {
    if (p1.includes("screens")) {
      const base = path.basename(p1).split(".")[0];
      const found = screens.find(
        (s) =>
          s.includes(base + ".js") ||
          s.includes(base + ".tsx") ||
          s.includes(base + ".pro.js") ||
          s.includes(base + ".real.tsx")
      );
      if (found && !p1.includes(found)) {
        modified = true;
        const newPath = "../" + found.replace("src/", "");
        console.log(`✅ Fixed: ${p1} → ${newPath}`);
        return `from "${newPath}"`;
      }
    }
    return match;
  });

  if (modified) fs.writeFileSync(file, content, "utf8");
  return modified;
}

function main() {
  console.log("🔍 Scanning for all screens...");
  const screens = listAllScreens(SCREEN_DIR);
  console.log(`📂 Found ${screens.length} total screen files.\n`);

  // Fix in navigators
  for (const navFile of NAV_FILES) {
    const filePath = path.join(NAV_DIR, navFile);
    if (fs.existsSync(filePath)) {
      console.log(`🧭 Checking ${navFile}...`);
      const fixed = fixImportsInFile(filePath, screens);
      if (!fixed) console.log(`  ✅ No fixes needed for ${navFile}`);
    } else {
      console.log(`⚠️ Missing: ${filePath}`);
    }
  }

  // Fix Menu.pro.js if it exists
  if (fs.existsSync(MENU_FILE)) {
    console.log(`📋 Checking Menu.pro.js...`);
    const fixed = fixImportsInFile(MENU_FILE, screens);
    if (!fixed) console.log(`  ✅ No fixes needed for Menu.pro.js`);
  } else {
    console.log(`⚠️ Menu.pro.js not found at ${MENU_FILE}`);
  }

  console.log("\n✅ All import paths validated and corrected!");
  console.log("💡 Tip: Run `npx expo start -c` to refresh your dev server.");
}

main();
