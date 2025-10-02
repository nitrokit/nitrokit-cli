const chalk = require("chalk");
const { setConfig } = require("../utils/config");

async function setApiKey(key) {
  if (!key) {
    console.error(chalk.red("Please provide an API key."));
    console.log(chalk.cyan("\nUsage: nitrokit config set gemini.apiKey <YOUR_API_KEY>"));
    return;
  }
  await setConfig('geminiApiKey', key);
  console.log(chalk.green('Google Gemini API key has been updated successfully!'));
}

const configCommand = {
  command: "config <action> [key] [value]",
  description: "Manage CLI configuration (e.g., API keys).",
  action: async (action, key, value) => {
    switch (action) {
      case 'set':
        if (key === 'gemini.apiKey') {
          await setApiKey(value);
        } else {
          console.error(chalk.red(`Unknown config key: "${key}"`));
          console.log(chalk.yellow("Available keys: gemini.apiKey"));
        }
        break;
      default:
        console.error(chalk.red(`Unknown action: "${action}". Available actions: set`));
    }
  },
};

module.exports = configCommand;