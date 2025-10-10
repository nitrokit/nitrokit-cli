const { execa } = require("execa");
const fs = require("fs-extra");
const path = require("path");
const { promisify } = require("util");
const stream = require("stream");
const ora = require("ora");
const chalk = require("chalk");
const tar = require("tar");
const cleanupFiles = require("../utils/new/cleanup");
const configureGit = require("../utils/new/git-config");
const configureEnv = require("../utils/new/env-config");
const configureDependencies = require("../utils/new/dependencies");
const createInitialCommit = require("../utils/new/git-commit");

const newCommand = {
  command: "new",
  description: "Creates a new Nitrokit project in a directory with the same name.",
  argumentDescription: "The name for the new project and directory.",
  action: async (projectName) => {
    const spinner = ora(chalk.blue`Creating project "${projectName}"...`).start();
    const repo = "nitrokit/nitrokit-nextjs";
    const projectPath = path.join(process.cwd(), projectName);

    // Hedef dizin zaten var mı diye kontrol et
    // Check if target directory already exists
    if (fs.existsSync(projectPath)) {
      spinner.fail(chalk.red`Error: Directory "${projectName}" already exists.`);
      process.exit(1);
    }

    try {
      // Proje dizinini oluştur
      // Create the project directory
      await fs.ensureDir(projectPath);
      // GitHub reposunu klonla
      // Clone GitHub repository
      const pipeline = promisify(stream.pipeline);

      try {
        spinner.text = "Fetching latest release information...";
        // Use dynamic import for ESM-only 'got' package
        const { default: got } = await import("got");
        const response = await got(`https://api.github.com/repos/${repo}/releases/latest`).json();
        const version = response.tag_name;
        const tarballUrl = response.tarball_url;

        spinner.text = `Downloading Nitrokit Next.js template ${chalk.yellow(version)}...`;
        
        await pipeline(
          got.stream(tarballUrl),
          tar.extract({ cwd: projectPath, strip: 1 })
        );

      } catch (error) {
        spinner.fail(chalk.red`Failed to download boilerplate. Please check your internet connection.`);
        throw error; // Hatanın ana catch bloğuna gitmesini sağla
      }

      // Klonlanan projenin dizinine geç
      // Change to cloned project directory
      process.chdir(projectPath);

      // Temizlik işlemleri
      // Cleanup operations
      await cleanupFiles(projectPath);

      // package.json güncelle
      // Update package.json
      const packageJsonPath = path.join(projectPath, "package.json");
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.name = projectName;
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

      spinner.succeed(chalk.green`Project "${projectName}" created successfully!`);

      // Git yapılandırması
      // Git configuration
      const isGitConfigured = await configureGit(projectPath);

      // ENV yapılandırması
      // ENV configuration
      await configureEnv(projectPath);

      // Paket yöneticisi ve bağımlılıklar
      // Package manager and dependencies
      const { packageManager, installed } = await configureDependencies(projectPath, packageJsonPath);

      if (installed) {
        spinner.succeed(chalk.green`Dependencies installed successfully!`);

        // Git repository yapılandırıldıysa ilk commit'i oluştur
        // If Git repository is configured, create the initial commit
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