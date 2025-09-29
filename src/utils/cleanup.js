const fs = require("fs-extra");
const path = require("path");

async function cleanupFiles(projectPath) {
  // Lock dosyalarını temizle
  await fs.remove(path.join(projectPath, "pnpm-lock.yaml"));
  await fs.remove(path.join(projectPath, "pnpm-workspace.yaml"));
  await fs.remove(path.join(projectPath, "yarn.lock"));
  await fs.remove(path.join(projectPath, "package-lock.json"));

  // .git klasörünü sil
  await fs.remove(path.join(projectPath, ".git"));

  // .github klasörünü sil
  await fs.remove(path.join(projectPath, ".github"));
  await fs.remove(path.join(projectPath, "crowdin.yml;"));
}

module.exports = cleanupFiles;