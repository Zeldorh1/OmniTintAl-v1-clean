#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";

console.log("🔍 Checking Expo Go vs Bare workflow setup...");

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const hasExpoGo = fs.existsSync("app.json") && pkg.dependencies["expo"];
const sdkVersion = pkg.dependencies["expo"]?.match(/\d+/)?.[0];
const reanimated = pkg.dependencies["react-native-reanimated"];

if (hasExpoGo && sdkVersion >= 54) {
  console.log("🧠 Detected Expo Go environment (SDK " + sdkVersion + ")");
  if (reanimated) {
    console.log("🧹 Removing local Reanimated — using Expo Go’s built-in version.");
    execSync("npm uninstall react-native-reanimated", { stdio: "inherit" });
  } else {
    console.log("✅ Already clean: no conflicting Reanimated version installed.");
  }
} else {
  console.log("⚙️ Detected bare / EAS build environment — ensuring correct version...");
  execSync("npm install react-native-reanimated@3.10.1", { stdio: "inherit" });
}

console.log("✨ Done! You can now run `npx expo start -c` safely.");
