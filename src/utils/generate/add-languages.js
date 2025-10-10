const fs = require("fs-extra");
const path = require("path");
const inquirer = require("inquirer");
const ora = require("ora");
const chalk = require("chalk");
const SUPPORTED_LANGUAGES = require("../../constants/languages");

async function addLanguages(projectRoot) {
  const spinner = ora();
  const localeConfigPath = path.join(projectRoot, "src", "constants", "locale.ts");
  const messagesPath = path.join(projectRoot, "messages");
  const baseLangPath = path.join(messagesPath, "en");

  // Gerekli dosyaların varlığını kontrol et
  // Check for the existence of required files
  if (!fs.existsSync(localeConfigPath) || !fs.existsSync(baseLangPath)) {
    console.error(chalk.red`Error: Could not find required project structure.`);
    console.error(chalk.yellow`Please run this command from the root of a Nitrokit project.`);
    process.exit();
  }

  // Mevcut dilleri oku
  // Read current languages
  spinner.start("Reading current language configuration...");
  const localeContent = await fs.readFile(localeConfigPath, "utf-8");
  const localesArrayMatch = localeContent.match(/export const LOCALES = \[(.*?)\] as const;/);

  if (!localesArrayMatch || !localesArrayMatch[1]) {
    spinner.fail(chalk.red`Could not parse 'locale.ts'.`);
    process.exit();
  }

  const existingLocales = localesArrayMatch[1].split(",").map((l) => l.trim().replace(/['"]/g, ""));
  spinner.succeed(`Current languages identified: ${existingLocales.join(", ")}`);

  // Kullanıcıya eklenebilecek dilleri sor
  // Ask the user for languages to add
  const availableLanguages = SUPPORTED_LANGUAGES.map(lang => ({
    name: `${lang.name} (${lang.nativeName})`, value: lang.value
  })).filter(
    (lang) => !existingLocales.includes(lang.value)
  );

  if (availableLanguages.length === 0) {
    console.log(chalk.yellow`All supported languages are already added to your project.`);
    return;
  }

  const { languagesToAdd } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "languagesToAdd",
      message: "Which language(s) would you like to add?",
      choices: availableLanguages,
      validate: (answer) => answer.length > 0 ? true : "You must choose at least one language.",
    },
  ]);

  if (languagesToAdd.length === 0) {
    console.log(chalk.cyan`No languages selected. Exiting.`);
    return;
  }

  // Seçilen diller için işlemleri yap
  // Perform operations for the selected languages
  spinner.start(`Adding ${languagesToAdd.length} language(s)...`);
  for (const lang of languagesToAdd) {
    const newLangPath = path.join(messagesPath, lang);
    await fs.copy(baseLangPath, newLangPath);
  }

  // 1. LOCALES dizisini ve LOCALE_CONFIG nesnesini güncelle
  // 1. Update the LOCALES array and LOCALE_CONFIG object
  const allLocales = [...existingLocales, ...languagesToAdd];
  const newLocalesString = allLocales.map((l) => `'${l}'`).join(", ");
  let updatedLocaleContent = localeContent.replace(
    /export const LOCALES = \[.*?\] as const;/,
    `export const LOCALES = [${newLocalesString}] as const;`
  );

  const newConfigEntries = languagesToAdd
    .map((langCode) => {
      const langDetails = SUPPORTED_LANGUAGES.find(l => l.value === langCode);
      if (!langDetails) return "";
      return `    ${langCode}: { name: '${langDetails.name}', flag: '/images/flags/${langDetails.flag}', nativeName: '${langDetails.nativeName}' }`;
    })
    .join(",\n");

  const configObjectRegex = /(export const LOCALE_CONFIG: Record<Locale, .*?> = {[\s\S]*?)(} as const;)/;
  if (configObjectRegex.test(updatedLocaleContent)) {
    const replacementLogic = (match, p1, p2) => {
      const trimmedP1 = p1.trim();
      const needsComma = trimmedP1.length > 0 && trimmedP1.charAt(trimmedP1.length - 1) !== '{' && trimmedP1.charAt(trimmedP1.length - 1) !== ',';
      return `${p1}${needsComma ? ',' : ''}\n${newConfigEntries}\n${p2}`;
    };
    updatedLocaleContent = updatedLocaleContent.replace(configObjectRegex, replacementLogic);
  }

  await fs.writeFile(localeConfigPath, updatedLocaleContent, "utf-8");

  spinner.succeed(chalk.green`Successfully added: ${languagesToAdd.join(", ")}`);
}

module.exports = addLanguages;