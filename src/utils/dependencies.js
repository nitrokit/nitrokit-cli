const inquirer = require("inquirer");
const { exec } = require("child_process");
const fs = require("fs-extra");
const ora = require("ora");
const chalk = require("chalk");

async function configureDependencies(projectPath, packageJsonPath) {
  const { packageManager } = await inquirer.prompt([
    {
      type: "list",
      name: "packageManager",
      message: "Which package manager would you like to use?",
      choices: ["pnpm", "npm", "yarn"],
      default: "pnpm",
    },
  ]);

  // packageManager alanını package.json'dan kaldır
  // Remove the packageManager field from package.json
  const pkgJson = await fs.readJson(packageJsonPath);
  delete pkgJson.packageManager;
  await fs.writeJson(packageJsonPath, pkgJson, { spaces: 2 });

  const spinner = ora(`Installing dependencies with ${chalk.green(packageManager)}...`).start();

  await new Promise((resolve, reject) => {
    exec(`${packageManager} install`, (err, stdout, stderr) => {
      if (err) {
        spinner.fail(chalk.red`Failed to install dependencies.`);
        console.error(stderr);
        return reject(err);
      }
      spinner.succeed(chalk.green`Dependencies installed successfully!`);
      resolve();
    });
  });

  return { packageManager, installed: true };
}

module.exports = configureDependencies;