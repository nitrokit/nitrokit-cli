const chalk = require("chalk");
const addLanguages = require("../utils/generate/add-languages");
const setDefaultLanguage = require("../utils/generate/set-default-language");

async function generateLanguage() {
  const projectRoot = process.cwd();

  try {
    // Aşama 1: Dilleri ekle
    // Phase 1: Add languages
    await addLanguages(projectRoot);

    // Aşama 2: Varsayılan dili ayarla
    // Phase 2: Set the default language
    await setDefaultLanguage(projectRoot);

    console.log(chalk.yellow`\nNext steps:`);
    console.log(
      chalk.cyan`  - Translate the JSON files in the new 'messages/<lang_code>' directories.`
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

const generateCommand = {
  command: "generate",
  description: "Generates and/or modifies files based on a schematic.",
  argument: ["<schematic>", "The schematic to generate. Currently only 'language' is supported."],
  action: async (schematic) => {
    if (schematic === "language") {
      await generateLanguage();
    } else {
      console.error(chalk.red`Unknown schematic: "${schematic}".`);
      console.log(chalk.yellow`Available schematics: language`);
    }
  },
};

module.exports = generateCommand;
