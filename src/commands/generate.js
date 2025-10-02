const fs = require("fs-extra");
const path = require("path");
const { execa } = require("execa");
const inquirer = require("inquirer");
const ora = require("ora");
const chalk = require("chalk");

// Desteklenen dillerin listesi. Bu listeyi genişletebilirsiniz.
// List of supported languages. You can expand this list.
// 'value' is the language code, 'flag' is the svg file name in 'public/images/flags/'.
const SUPPORTED_LANGUAGES = [
  { name: "Turkish", value: "tr", nativeName: "Türkçe", flag: "tr.svg" },
  { name: "English", value: "en", nativeName: "English", flag: "us.svg" },
  { name: "Azerbaijani", value: "az", nativeName: "Azərbaycanca", flag: "az.svg" },
  { name: "Bosnian", value: "bs", nativeName: "Bosanski", flag: "ba.svg" },
  { name: "Chinese (Simplified)", value: "zh", nativeName: "简体中文", flag: "cn.svg" },
  { name: "German", value: "de", nativeName: "Deutsch", flag: "de.svg" },
  { name: "Spanish", value: "es", nativeName: "Español", flag: "es.svg" },
  { name: "French", value: "fr", nativeName: "Français", flag: "fr.svg" },
  { name: "Indonesian", value: "id", nativeName: "Bahasa Indonesia", flag: "id.svg" },
  { name: "Hindi", value: "hi", nativeName: "हिन्दी", flag: "in.svg" },
  { name: "Italian", value: "it", nativeName: "Italiano", flag: "it.svg" },
  { name: "Kyrgyz", value: "ky", nativeName: "Кыргызча", flag: "kg.svg" },
  { name: "Korean", value: "ko", nativeName: "한국어", flag: "kr.svg" },
  { name: "Kazakh", value: "kk", nativeName: "Қазақша", flag: "kz.svg" },
  { name: "Urdu", value: "ur", nativeName: "اردو", flag: "pk.svg" },
  { name: "Russian", value: "ru", nativeName: "Русский", flag: "ru.svg" },
  { name: "Arabic", value: "ar", nativeName: "العربية", flag: "sa.svg" },
  { name: "Turkmen", value: "tk", nativeName: "Türkmençe", flag: "tm.svg" },
  { name: "Uzbek", value: "uz", nativeName: "Oʻzbekcha", flag: "uz.svg" },
];

async function generateLanguage() {
  const spinner = ora();
  const projectRoot = process.cwd();
  const localeConfigPath = path.join(
    projectRoot,
    "src",
    "constants",
    "locale.ts"
  );
  const messagesPath = path.join(projectRoot, "messages");
  const globalTypesPath = path.join(projectRoot, "src", "types", "global.d.ts");
  const requestConfigPath = path.join(projectRoot, "src", "lib", "i18n", "request.ts");
  const baseLangPath = path.join(messagesPath, "en");

  try {
    // Gerekli dosyaların varlığını kontrol et
    // Check for the existence of required files
    if (!fs.existsSync(localeConfigPath) || !fs.existsSync(baseLangPath)) {
      console.error(
        chalk.red`Error: Could not find required project structure.`
      );
      console.error(
        chalk.yellow`Please run this command from the root of a Nitrokit project.`
      );
      process.exit(1);
    }

    // Mevcut dilleri oku
    // Read current languages
    spinner.start("Reading current language configuration...");
    const localeContent = await fs.readFile(localeConfigPath, "utf-8");
    const localesArrayMatch = localeContent.match(
      /export const LOCALES = \[(.*?)\] as const;/
    );

    if (!localesArrayMatch || !localesArrayMatch[1]) {
      spinner.fail(chalk.red`Could not parse 'locale.ts'.`);
      process.exit(1);
    }

    const existingLocales = localesArrayMatch[1]
      .split(",")
      .map((l) => l.trim().replace(/['"]/g, ""));
    spinner.succeed(`Current languages identified: ${existingLocales.join(", ")}`);

    // Kullanıcıya eklenebilecek dilleri sor
    // Ask the user for languages to add
    // Projede zaten var olan dilleri listeden çıkar
    // Filter out languages that already exist in the project
    const availableLanguages = SUPPORTED_LANGUAGES.map(lang => ({
      name: `${lang.name} (${lang.nativeName})`, value: lang.value
    })).filter(
      (lang) => !existingLocales.includes(lang.value)
    );

    if (availableLanguages.length === 0) {
      console.log(
        chalk.yellow`All supported languages are already added to your project.`
      );
      return;
    }

    const { languagesToAdd } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "languagesToAdd",
        message: "Which language(s) would you like to add?",
        choices: availableLanguages,
        validate: (answer) =>
          answer.length > 0 ? true : "You must choose at least one language.",
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

    // 1. LOCALES dizisini güncelle
    // 1. Update the LOCALES array
    const allLocales = [...existingLocales, ...languagesToAdd];
    const newLocalesString = allLocales.map((l) => `'${l}'`).join(", ");
    let updatedLocaleContent = localeContent.replace(
      /export const LOCALES = \[.*?\] as const;/,
      `export const LOCALES = [${newLocalesString}] as const;`
    );

    // 2. LOCALE_CONFIG nesnesini güncelle
    // 2. Update the LOCALE_CONFIG object
    const newConfigEntries = languagesToAdd
      .map((langCode) => {
        const langDetails = SUPPORTED_LANGUAGES.find(l => l.value === langCode);
        if (!langDetails) return "";
        // Use the flag defined in our list. Add a comma at the end for proper object syntax.
        return `    ${langCode}: { name: '${langDetails.name}', flag: '/images/flags/${langDetails.flag}', nativeName: '${langDetails.nativeName}' }`;
      })
      .join(",\n");

    const configObjectRegex = /(export const LOCALE_CONFIG: Record<Locale, .*?> = {[\s\S]*?)(} as const;)/;
    if (configObjectRegex.test(updatedLocaleContent)) {
      // Check if the last character before the closing brace is a comma.
      // If not, add one before adding new entries.
      const replacementLogic = (match, p1, p2) => {
        const trimmedP1 = p1.trim();
        const needsComma = trimmedP1.length > 0 && trimmedP1.charAt(trimmedP1.length - 1) !== '{' && trimmedP1.charAt(trimmedP1.length - 1) !== ',';
        return `${p1}${needsComma ? ',' : ''}\n${newConfigEntries}\n${p2}`;
      };
      updatedLocaleContent = updatedLocaleContent.replace(
        configObjectRegex,
        replacementLogic
      );
    }

    await fs.writeFile(localeConfigPath, updatedLocaleContent, "utf-8");

    // --- Varsayılan Dili Ayarlama Aşaması ---
    // --- Set Default Language Phase ---

    const { configureDefault } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'configureDefault',
        message: 'Would you like to set a new default language for the project?',
        default: false,
      },
    ]);

    if (configureDefault) {
      spinner.start('Reading updated language list...');
      // Dosyanın en güncel halini tekrar oku
      // Re-read the most up-to-date version of the file
      const latestLocaleContent = await fs.readFile(localeConfigPath, 'utf-8');
      const latestLocalesMatch = latestLocaleContent.match(/export const LOCALES = \[(.*?)\] as const;/);
      const currentDefaultMatch = latestLocaleContent.match(/export const DEFAULT_LANGUAGE: Locale = '(.*)';/);

      if (!latestLocalesMatch || !currentDefaultMatch) {
        spinner.fail(chalk.red`Could not re-read 'locale.ts' to set a new default language.`);
        process.exit(1);
      }

      const allAvailableLocales = latestLocalesMatch[1].split(",").map((l) => l.trim().replace(/['"]/g, ""));
      const currentDefault = currentDefaultMatch[1];
      spinner.succeed('Updated language list loaded.');

      const { newDefaultLanguage } = await inquirer.prompt([
        {
          type: 'list',
          name: 'newDefaultLanguage',
          message: 'Which language should be the default?',
          choices: allAvailableLocales,
          default: currentDefault,
        },
      ]);

      if (newDefaultLanguage !== currentDefault) {
        spinner.start(`Setting default language to "${newDefaultLanguage}"...`);

        // 1. global.d.ts dosyasını güncelle
        // 1. Update global.d.ts file
        if (await fs.pathExists(globalTypesPath)) {
          let globalTypesContent = await fs.readFile(globalTypesPath, "utf-8");
          globalTypesContent = globalTypesContent.replace(/(\.\.\/messages\/)[a-z]{2,5}(\/)/g, `$1${newDefaultLanguage}$2`);
          await fs.writeFile(globalTypesPath, globalTypesContent, "utf-8");
        }

        // 2. i18n bildirim dosyasını oluştur (generate-i18n-declaration.sh mantığı)
        // 2. Generate i18n declaration file (logic from generate-i18n-declaration.sh)
        const defaultLangMessagesPath = path.join(messagesPath, newDefaultLanguage);
        const declarationFilePath = path.join(messagesPath, "declarations.d.json");
        const messageFiles = await fs.readdir(defaultLangMessagesPath);
        const declarationObject = {};
        for (const file of messageFiles.filter(f => f.endsWith('.json'))) {
          const moduleName = path.basename(file, '.json');
          declarationObject[moduleName] = await fs.readJson(path.join(defaultLangMessagesPath, file));
        }
        await fs.writeJson(declarationFilePath, declarationObject, { spaces: 2 });

        // 3. request.ts dosyasını dinamik hale getir
        // 3. Make request.ts dynamic
        if (await fs.pathExists(requestConfigPath)) {
          const moduleNames = Object.keys(declarationObject);
          const importStatements = moduleNames.map(name => `        import(\`../../../messages/\${locale}/${name}.json\`),`).join('\n');
          const messagesObject = moduleNames.map((name, index) => `            ${name}: messageModules[${index}].default,`).join('\n');

          let requestContent = await fs.readFile(requestConfigPath, 'utf-8');
          requestContent = requestContent.replace(/const messageModules = await Promise\.all\(\[[\s\S]*?\]\);/, `const messageModules = await Promise.all([\n${importStatements}\n    ]);`);
          requestContent = requestContent.replace(/messages: {[\s\S]*?},/, `messages: {\n${messagesObject}\n        },`);
          await fs.writeFile(requestConfigPath, requestContent, 'utf-8');
        }

        // 4. locale.ts dosyasındaki DEFAULT_LANGUAGE'ı güncelle
        // 4. Update DEFAULT_LANGUAGE in locale.ts
        let finalLocaleContent = await fs.readFile(localeConfigPath, 'utf-8');
        finalLocaleContent = finalLocaleContent.replace(/export const DEFAULT_LANGUAGE: Locale = '.*';/, `export const DEFAULT_LANGUAGE: Locale = '${newDefaultLanguage}';`);
        await fs.writeFile(localeConfigPath, finalLocaleContent, 'utf-8');

        spinner.succeed(`Default language set to "${newDefaultLanguage}".`);
      } else {
        console.log(chalk.cyan('Default language remains unchanged.'));
      }
    }

    spinner.succeed(
      chalk.green`Successfully added: ${languagesToAdd.join(", ")}`
    );
    console.log(chalk.yellow`\nNext steps:`);
    console.log(
      chalk.cyan`  - Translate the JSON files in the new 'messages/<lang_code>' directories.`
    );
  } catch (error) {
    spinner.fail(chalk.red`An error occurred during language generation.`);
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
