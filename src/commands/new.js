const { exec } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const ora = require("ora");
const chalk = require("chalk");

const cleanupFiles = require("../utils/cleanup");
const configureGit = require("../utils/git-config");
const configureEnv = require("../utils/env-config");
const configureDependencies = require("../utils/dependencies");
const createInitialCommit = require("../utils/git-commit");

const newCommand = {
  command: "new",
  description: "Create a new Nitrokit project from the boilerplate.",
  arguments: ["<project-name>", "Name of the new project"],
  action: async (projectName) => {
    const spinner = ora(chalk.blue`Creating project "${projectName}"...`).start();
    const boilerplateUrl = "https://github.com/nitrokit/nitrokit-nextjs.git";
    const projectPath = path.join(process.cwd(), projectName);

    // Hedef dizin zaten var mı diye kontrol et
    // Check if target directory already exists
    if (fs.existsSync(projectPath)) {
      spinner.fail(chalk.red`Error: Directory "${projectName}" already exists.`);
      process.exit(1);
    }

    try {
      // GitHub reposunu klonla
      // Clone GitHub repository
      await new Promise((resolve, reject) => {
        exec(`git clone ${boilerplateUrl} ${projectName}`, (err, stdout, stderr) => {
          if (err) {
            spinner.fail(chalk.red`Failed to clone boilerplate repository. Please check your internet connection and Git installation.`);
            return reject(err);
          }
          resolve();
        });
      });

      // Klonlanan projenin dizinine geç
      // Change to cloned project directory
      process.chdir(projectPath);

      // Temizlik işlemleri
      await cleanupFiles(projectPath);

      // package.json güncelle
      // Update package.json
      const packageJsonPath = path.join(projectPath, "package.json");
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.name = projectName;
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

      spinner.succeed(chalk.green`Project "${projectName}" created successfully!`);

      // Git yapılandırması
      const isGitConfigured = await configureGit(projectPath);

      // ENV yapılandırması
      await configureEnv(projectPath);

      // Paket yöneticisi ve bağımlılıklar
      const { packageManager, installed } = await configureDependencies(projectPath, packageJsonPath);

      if (installed) {
        spinner.succeed(chalk.green`Dependencies installed successfully!`);

        // Git repository yapılandırıldıysa ilk commit'i oluştur
        if (isGitConfigured) {
          await createInitialCommit();
        }
      }

      console.log(chalk.yellow`\nNext steps:`);
      console.log(chalk.cyan`  cd ${projectName}`);
      if (!installed) {
        console.log(chalk.cyan`  ${packageManager} install`);
      }
      console.log(chalk.cyan`  ${packageManager} run dev`);
      console.log(chalk.yellow`\nHappy coding!`);
    } catch (error) {
      spinner.fail(chalk.red`Failed to create project. Please check your internet connection or try again.`);
      console.error(error);
      process.exit(1);
    }
  }
};

module.exports = newCommand;