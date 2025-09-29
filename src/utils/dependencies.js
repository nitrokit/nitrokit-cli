const inquirer = require("inquirer");
const { exec } = require("child_process");
const fs = require("fs-extra");
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
  const pkgJson = await fs.readJson(packageJsonPath);
  delete pkgJson.packageManager;
  await fs.writeJson(packageJsonPath, pkgJson, { spaces: 2 });

  const { confirmInstall } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmInstall",
      message: "Would you like to install the dependencies now?",
      default: true,
    },
  ]);

  let installed = false;
  if (confirmInstall) {
    await new Promise((resolve, reject) => {
      exec(`${packageManager} install`, (err, stdout, stderr) => {
        if (err) {
          console.error(stderr);
          return reject(err);
        }
        resolve();
      });
    });
    installed = true;
  }

  return { packageManager, installed };
}

module.exports = configureDependencies;