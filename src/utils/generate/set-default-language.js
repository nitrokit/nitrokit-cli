const fs = require("fs-extra");
const path = require("path");
const inquirer = require("inquirer");
const ora = require("ora");
const chalk = require("chalk");

async function setDefaultLanguage(projectRoot) {
  const spinner = ora();
  const localeConfigPath = path.join(projectRoot, "src", "constants", "locale.ts");
  const globalTypesPath = path.join(projectRoot, "src", "types", "global.d.ts");
  const messagesPath = path.join(projectRoot, "messages");
  const requestConfigPath = path.join(projectRoot, "src", "lib", "i18n", "request.ts");

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

      // 1. Update global.d.ts file
      if (await fs.pathExists(globalTypesPath)) {
        let globalTypesContent = await fs.readFile(globalTypesPath, "utf-8");
        globalTypesContent = globalTypesContent.replace(/(\.\.\/messages\/)[a-z]{2,5}(\/)/g, `$1${newDefaultLanguage}$2`);
        await fs.writeFile(globalTypesPath, globalTypesContent, "utf-8");
      }

      // 2. Generate i18n declaration file
      const defaultLangMessagesPath = path.join(messagesPath, newDefaultLanguage);
      const declarationFilePath = path.join(messagesPath, "declarations.d.json");
      const messageFiles = await fs.readdir(defaultLangMessagesPath);
      const declarationObject = {};
      for (const file of messageFiles.filter(f => f.endsWith('.json'))) {
        const moduleName = path.basename(file, '.json');
        declarationObject[moduleName] = await fs.readJson(path.join(defaultLangMessagesPath, file));
      }
      await fs.writeJson(declarationFilePath, declarationObject, { spaces: 2 });

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

      // 4. Update DEFAULT_LANGUAGE in locale.ts
      let finalLocaleContent = await fs.readFile(localeConfigPath, 'utf-8');
      finalLocaleContent = finalLocaleContent.replace(/export const DEFAULT_LANGUAGE: Locale = '.*';/, `export const DEFAULT_LANGUAGE: Locale = '${newDefaultLanguage}';`);
      await fs.writeFile(localeConfigPath, finalLocaleContent, 'utf-8');

      spinner.succeed(`Default language set to "${newDefaultLanguage}".`);
    } else {
      console.log(chalk.cyan('Default language remains unchanged.'));
    }
  }
}

module.exports = setDefaultLanguage;