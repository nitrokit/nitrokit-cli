const inquirer = require("inquirer");
const { exec } = require("child_process");
const chalk = require("chalk");

async function configureGit(projectPath) {
  const { configureGit, gitRepoUrl } = await inquirer.prompt([
    {
      type: "confirm",
      name: "configureGit",
      message: "Would you like to initialize Git repository?",
      default: true,
    },
    {
      type: "input",
      name: "gitRepoUrl",
      message: "Enter your Git repository URL:",
      when: (answers) => answers.configureGit,
      validate: (input) => {
        const valid =
          input.trim().length > 0 &&
          (input.startsWith("git@") || input.startsWith("https://"));
        return valid || "Please enter a valid Git repository URL";
      },
    },
  ]);

  if (configureGit) {
    console.log(chalk.cyan`\nInitializing Git repository...`);
    await new Promise((resolve, reject) => {
      exec("git init", (err, stdout, stderr) => {
        if (err) {
          console.error(stderr);
          return reject(err);
        }
        resolve();
      });
    });

    // Remote repository'i ekle
    await new Promise((resolve, reject) => {
      exec(`git remote add origin ${gitRepoUrl}`, (err, stdout, stderr) => {
        if (err) {
          console.error(stderr);
          return reject(err);
        }
        resolve();
      });
    });

    console.log(chalk.green`\nGit repository initialized successfully!`);
  }

  return configureGit;
}

module.exports = configureGit;