const chalk = require("chalk");
const addLanguages = require("../utils/generate/add-languages");
const setDefaultLanguage = require("../utils/generate/set-default-language");

/**
 * Executes the language generation flow: adding new languages and setting the default one.
 * @returns {Promise<void>}
 */
async function generateLanguage() {
  const projectRoot = process.cwd();

  try {
    // Phase 1: Add languages
    await addLanguages(projectRoot);

    // Phase 2: Set the default language
    await setDefaultLanguage(projectRoot);

    console.log(chalk.yellow`\nNext steps:`);
    console.log(
      chalk.cyan`  - Translate the JSON files in the new 'messages/<lang_code>' directories.`
    );
  } catch (error) {
    console.error(error);
    // Throw an error instead of calling process.exit(1) for test compatibility
    throw new Error("Language generation failed.");
  }
}

const generateCommand = {
  command: "generate",
  description: "Generates and/or modifies files based on a schematic.",
  argument: [
    "<schematic>",
    "The schematic to generate. Currently only 'language' is supported.",
  ],
  action: async (schematic) => {
    if (schematic === "language") {
      await generateLanguage();
    } else {
      console.error(chalk.red`Unknown schematic: "${schematic}".`);
      console.log(chalk.yellow`Available schematics: language`);
      // No critical crash, just user error.
    }
  },
};

module.exports = generateCommand;
