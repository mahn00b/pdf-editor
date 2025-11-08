import fs from "node:fs";
import path from "node:path";

/**
 * Recursively find all package.json files under a directory
 * @param {string} rootDir
 * @returns {string[]} paths to package.json files
 */
export function findPackageJsonFiles(rootDir) {
  let results = [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules for speed
      if (entry.name === "node_modules") continue;
      results = results.concat(findPackageJsonFiles(fullPath));
    } else if (entry.name === "package.json") {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Replace all occurrences of a placeholder string in a file
 * @param {string} filePath
 * @param {string} placeholder
 * @param {string} replacement
 */
export function replaceInFile(filePath, placeholder, replacement) {
  const content = fs.readFileSync(filePath, "utf8");
  const updated = content.replaceAll(placeholder, replacement);
  if (updated !== content) {
    fs.writeFileSync(filePath, updated);
    console.log(`✅ Updated ${filePath}`);
  }
}
