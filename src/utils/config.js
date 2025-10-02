const fs = require("fs-extra");
const os = require("os");
const path = require("path");

const configDir = path.join(os.homedir(), ".config", "nitrokit-cli");
const configPath = path.join(configDir, "config.json");

async function getConfig() {
  try {
    if (await fs.pathExists(configPath)) {
      return await fs.readJson(configPath);
    }
  } catch (e) {
    // Ignore errors, just return an empty object
  }
  return {};
}

async function setConfig(key, value) {
  await fs.ensureDir(configDir);
  const config = await getConfig();
  config[key] = value;
  await fs.writeJson(configPath, config, { spaces: 2 });
}

module.exports = { getConfig, setConfig };