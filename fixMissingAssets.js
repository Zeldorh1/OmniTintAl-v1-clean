import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const placeholderDir = path.join(projectRoot, "assets/images");
const missingFiles = [
  "../../assets/images/locs_highbun.png",
  "../../assets/images/locs_bun.png",
  "../../assets/images/locs_puff.png",
  "../../assets/images/locs_updo.png",
  "../../assets/placeholder.png",
];

console.log("🔍 Creating placeholder images if missing...\n");

missingFiles.forEach((relPath) => {
  const fullPath = path.resolve(path.join(projectRoot, "src/screens/premium", relPath));
  const dir = path.dirname(fullPath);

  // ensure directory exists
  fs.mkdirSync(dir, { recursive: true });

  // create placeholder if not present
  if (!fs.existsSync(fullPath)) {
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x63, 0x60, 0x00, 0x00, 0x00,
      0x02, 0x00, 0x01, 0xE5, 0x27, 0xD4, 0xA9, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82,
    ]);
    fs.writeFileSync(fullPath, pngHeader);
    console.log(`✅ Created placeholder: ${relPath}`);
  } else {
    console.log(`✔ Already exists: ${relPath}`);
  }
});

console.log("\n🎉 All placeholder images ready.");
