#!/usr/bin/env node

const { Command } = require("commander");
const fs = require("fs-extra");
const path = require("path");

const packageJsonPath = path.join(__dirname, "package.json");
const packageJson = fs.readJsonSync(packageJsonPath);

const checkForUpdates = require("./src/utils/check-for-updates");
const newCommand = require("./src/commands/new");
const generateCommand = require("./src/commands/generate");
const updateCommand = require("./src/commands/update");

const program = new Command();

program
  .name("nitrokit")
  .description("A CLI to help create and manage Nitrokit projects.")
  .version(packageJson.version);

program.command(newCommand.command)
  .description(newCommand.description)
  .argument(`<project-name>`, newCommand.argumentDescription)
  .action(newCommand.action);

program.command(generateCommand.command)
  .description(generateCommand.description)
  .argument(...generateCommand.argument)
  .action(generateCommand.action);

const updateCmd = program
  .command(updateCommand.command)
  .description(updateCommand.description)
  .action(updateCommand.action);

updateCommand.options.forEach(option => {
  updateCmd.option(...option);
});

(async () => {
  await checkForUpdates(packageJson);
  await program.parseAsync(process.argv);
})();
