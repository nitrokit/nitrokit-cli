#!/usr/bin/env node

const { Command } = require("commander");
const fs = require("fs-extra");
const path = require("path");

const packageJsonPath = path.join(__dirname, "package.json");
const packageJson = fs.readJsonSync(packageJsonPath);

const newCommand = require("./src/commands/new");
const generateCommand = require("./src/commands/generate");
const updateCommand = require("./src/commands/update");

const program = new Command();

program
  .name("nitrokit")
  .description("A CLI to help create and manage Nitrokit projects.")
  .version(packageJson.version)
  .command(newCommand.command)
  .description(newCommand.description)
  .argument(...newCommand.arguments)
  .action(newCommand.action);

program
  .command(generateCommand.command)
  .description(generateCommand.description)
  .action(generateCommand.action);

const updateCmd = program
  .command(updateCommand.command)
  .description(updateCommand.description)
  .action(updateCommand.action);

updateCommand.options.forEach(option => {
  updateCmd.option(...option);
});

program.parse(process.argv);
