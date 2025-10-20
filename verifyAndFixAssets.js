import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const screenRoot = path.join(projectRoot, "src/screens");

// 🔍 Match all asset references: images, audio, and video
const assetRegex = /require\(['"](.+?\.(png|jpg|jpeg|gif|mp4|mp3|wav))['"]\)/g;

// 1x1 transparent PNG placeholder
const blankPng = Buffer.from([
  0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,
  0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,
  0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,
  0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,
  0xDE,0x00,0x00,0x00,0x0A,0x49,0x44,0x41,
  0x54,0x78,0x9C,0x63,0x60,0x00,0x00,0x00,
  0x02,0x00,0x01,0xE5,0x27,0xD4,0xA9,0x00,
  0x00,0x00,0x00,0x49,0x45,0x4E,0x44,0xAE,
  0x42,0x60,0x82,
]);

const blankBytes = Buffer.alloc(1, 0); // for mp3/wav/mp4 placeholders
let missing = [];

function scan(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const s = fs.statSync(full);
    if (s.isDirectory()) scan(full);
    else if (/\.(js|jsx|ts|tsx)$/.test(f)) {
      const code = fs.readFileSync(full, "utf8");
      let m;
      while ((m = assetRegex.exec(code))) {
        const rel = m[1];
        const abs = path.resolve(path.join(path.dirname(full), rel));
        if (!fs.existsSync(abs)) missing.push({ file: full, rel, abs });
      }
    }
  }
}

console.log("🔍 Scanning project for missing media assets...");
scan(screenRoot);

if (!missing.length) {
  console.log("✅ All asset references resolved!");
  process.exit(0);
}

console.log(`\n⚠️ Missing assets found: ${missing.length}\n`);
missing.forEach(({ rel }) => console.log("→ " + rel));

missing.forEach(({ rel, abs }) => {
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  if (!fs.existsSync(abs)) {
    const ext = path.extname(abs).toLowerCase();
    if ([".png", ".jpg", ".jpeg", ".gif"].includes(ext)) {
      fs.writeFileSync(abs, blankPng);
    } else if ([".mp4", ".mp3", ".wav"].includes(ext)) {
      fs.writeFileSync(abs, blankBytes);
    }
    console.log("✅ Created placeholder:", rel);
  }
});

console.log("\n🎉 Verification complete — all missing media files replaced safely!");
