#!/usr/bin/env node

const { Command } = require("commander");
const { exec } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const ora = require("ora");
const chalk = require("chalk");
const inquirer = require("inquirer");

// CLI komutunu tanımlıyoruz
// Defining the CLI command
const program = new Command();

program
  .name("nitrokit")
  .description("A CLI to help create and manage Nitrokit projects.")
  .version("1.0.0");

program
  .command("new")
  .description("Create a new Nitrokit project from the boilerplate.")
  .argument("<project-name>", "Name of the new project")
  .action(async (projectName) => {
    // Kullanıcıya paket yöneticisini seçtir
    // Prompting the user to select a package manager
    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "packageManager",
        message: "Which package manager would you like to use?",
        choices: ["pnpm", "npm", "yarn"],
        default: "pnpm",
      },
    ]);

    const packageManager = answers.packageManager;

    const spinner = ora(
      chalk.blue`Creating project "${projectName}"...`
    ).start();

    const boilerplateUrl = "https://github.com/nitrokit/nitrokit-nextjs.git";
    const projectPath = path.join(process.cwd(), projectName);

    // Hedef dizin zaten var mı diye kontrol et
    // Checking if the target directory already exists
    if (fs.existsSync(projectPath)) {
      spinner.fail(
        chalk.red`Error: Directory "${projectName}" already exists.`
      );
      process.exit(1);
    }

    try {
      // GitHub reposunu klonla
      // Cloning the GitHub repo
      await new Promise((resolve, reject) => {
        exec(
          `git clone ${boilerplateUrl} ${projectName}`,
          (err, stdout, stderr) => {
            if (err) {
              console.error(stderr);
              return reject(err);
            }
            resolve();
          }
        );
      });

      // Klonlanan projenin dizinine geç
      // Changing to the cloned project's directory
      process.chdir(projectPath);

      // Sadece seçilen paket yöneticisinin kilit dosyasını tut
      // Removing lock files of other package managers
      await fs.remove("pnpm-lock.yaml");
      await fs.remove("yarn.lock");
      await fs.remove("package-lock.json");

      // .git klasörünü silerek yeni projeyi temizle
      // Removing the .git folder to make it a new, clean project
      await fs.remove(path.join(projectPath, ".git"));

      // Otomatik olarak bağımlılıkları yükle
      // Automatically installing dependencies
      spinner.text = chalk.blue`Installing dependencies with ${packageManager}...`;
      await new Promise((resolve, reject) => {
        exec(`${packageManager} install`, (err, stdout, stderr) => {
          if (err) {
            console.error(stderr);
            return reject(err);
          }
          resolve();
        });
      });

      spinner.succeed(
        chalk.green`Project "${projectName}" created and dependencies installed successfully!`
      );

      console.log(chalk.yellow`\nNext steps:`);
      console.log(chalk.cyan`  cd ${projectName}`);
      console.log(chalk.cyan(`  ${packageManager} run dev`));
      console.log(chalk.yellow`\nHappy coding!`);
    } catch (error) {
      spinner.fail(
        chalk.red(
          "Failed to create project. Please check your internet connection or try again."
        )
      );
      console.error(error);
      process.exit(1);
    }
  });

program.parse(process.argv);
