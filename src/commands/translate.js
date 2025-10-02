const fs = require("fs-extra");
const path = require("path");
const inquirer = require("inquirer");
const ora = require("ora");
const chalk = require("chalk");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const SUPPORTED_LANGUAGES = require("../constants/languages");
const { getConfig, setConfig } = require("../utils/config");

function cleanJson(text) {
  const match = text.match(/```json\n([\s\S]*?)\n```/);
  return match ? match[1] : text;
}

async function translateFile(genAI, sourceContent, targetLangCode, fileName) {
  const targetLanguage = SUPPORTED_LANGUAGES.find(l => l.value === targetLangCode)?.name || targetLangCode;
  
  // Try the modern, faster model first.
  let model;
  try {
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    // Ping the model to see if it's accessible, without making a full request yet.
    await model.countTokens("test"); 
  } catch (error) {
    // If the flash model fails, fall back to the most stable and widely available model.
    model = genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  const prompt = `
    Translate the following JSON object values from English to ${targetLanguage}.
    IMPORTANT:
    1. Keep the JSON structure and all keys exactly the same.
    2. Only translate the string values.
    3. Do not add any comments or extra text.
    4. Your response must be only the valid, translated JSON object.

    Source JSON for file "${fileName}":
    ${JSON.stringify(sourceContent, null, 2)}
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  try {
    return JSON.parse(cleanJson(text));
  } catch (parseError) {
    throw new Error(
      `Failed to parse JSON response from AI for file "${fileName}".\n` +
      `Received text: ${text}`
    );
  }
}

async function translateLanguages() {
  const projectRoot = process.cwd();
  const messagesPath = path.join(projectRoot, "messages");
  const baseLangPath = path.join(messagesPath, "en");

  if (!await fs.pathExists(baseLangPath)) {
    console.error(chalk.red`Error: 'messages/en' directory not found.`);
    console.error(chalk.yellow`Please run this command from the root of a Nitrokit project.`);
    process.exit(1);
  }

  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const config = await getConfig();
    apiKey = config.geminiApiKey;
  }

  if (!apiKey) {
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your Google Gemini API key:',
        mask: '*',
        validate: input => input.length > 0 ? true : 'API key cannot be empty.',
      },
      {
        type: 'confirm',
        name: 'saveKey',
        message: 'Save this API key for future use? (stored in ~/.config/nitrokit-cli/config.json)',
        default: true,
      },
    ]);
    apiKey = answers.apiKey;
    if (answers.saveKey) {
      await setConfig('geminiApiKey', apiKey);
      console.log(chalk.green('API key saved successfully!'));
    }
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const existingDirs = await fs.readdir(messagesPath);
  const availableLangs = existingDirs.filter(dir => dir !== 'en' && fs.lstatSync(path.join(messagesPath, dir)).isDirectory());

  if (availableLangs.length === 0) {
    console.log(chalk.yellow('No other languages found to translate. Use "nitrokit generate language" to add new ones.'));
    return;
  }

  const { languagesToTranslate } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'languagesToTranslate',
      message: 'Which language(s) would you like to translate?',
      choices: availableLangs,
      validate: answer => answer.length > 0 ? true : 'You must choose at least one language.',
    },
  ]);

  if (languagesToTranslate.length === 0) {
    console.log(chalk.cyan('No languages selected. Exiting.'));
    return;
  }

  const spinner = ora().start();

  try {
    const sourceFiles = await fs.readdir(baseLangPath);

    for (const lang of languagesToTranslate) {
      for (const file of sourceFiles.filter(f => f.endsWith('.json'))) {
        spinner.text = `Translating ${chalk.cyan(file)} to ${chalk.green(lang)}...`;
        const sourcePath = path.join(baseLangPath, file);
        const targetPath = path.join(messagesPath, lang, file);

        const sourceContent = await fs.readJson(sourcePath);
        const translatedContent = await translateFile(genAI, sourceContent, lang, file);

        await fs.writeJson(targetPath, translatedContent, { spaces: 2 });
      }
    }
    spinner.succeed(chalk.green`All selected languages have been translated successfully!`);
  } catch (error) {
    spinner.fail(chalk.red`An error occurred during translation.`);
    if (error.message && error.message.includes("API key not valid")) {
      console.error(chalk.red`\n[Authentication Error] Your Google Gemini API key is not valid. Please check your key and try again.`);
    } else if (error.message && error.message.includes("404 Not Found")) {
      console.error(chalk.red`\n[Model Not Found] The Gemini models are not accessible with this API key.`);
      console.error(chalk.yellow`This usually happens with keys from AI Studio. For programmatic access, you need a Google Cloud project key.`);
      console.log(chalk.cyan`\nTo fix this:`);
      console.log(chalk.cyan`  1. Go to Google Cloud Console: https://console.cloud.google.com/`);
      console.log(chalk.cyan`  2. Create a project and enable the "Generative Language API".`);
      console.log(chalk.cyan`  3. Create a new API key within that project.`);
    } else {
      console.error(chalk.red(error.message || error));
    }
    process.exit(1);
  }
}

const translateCommand = {
  command: "translate",
  description: "Automatically translate language files using AI (Gemini).",
  action: translateLanguages,
};

module.exports = translateCommand;