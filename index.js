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
    const spinner = ora(
      chalk.blue`Creating project "${projectName}"...`
    ).start();
    const boilerplateUrl = "https://github.com/nitrokit/nitrokit-nextjs.git";
    const projectPath = path.join(process.cwd(), projectName);

    // Hedef dizin zaten var mı diye kontrol et
    // Check if target directory already exists
    if (fs.existsSync(projectPath)) {
      spinner.fail(
        chalk.red`Error: Directory "${projectName}" already exists.`
      );
      process.exit(1);
    }

    try {
      // GitHub reposunu klonla
      // Clone GitHub repository
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
      // Change to cloned project directory
      process.chdir(projectPath);

      // Lock dosyalarını temizle
      // Clean up lock files
      await fs.remove("pnpm-lock.yaml");
      await fs.remove("pnpm-workspace.yaml");
      await fs.remove("yarn.lock");
      await fs.remove("package-lock.json");

      // .git klasörünü sil
      // Remove .git folder
      await fs.remove(path.join(projectPath, ".git"));

      // package.json güncelle
      // Update package.json
      const packageJsonPath = path.join(projectPath, "package.json");
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.name = projectName;
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

      // .env.example işlemleri
      // .env.example operations
      const envExamplePath = path.join(projectPath, ".env.example");
      const envPath = path.join(projectPath, ".env");
      if (await fs.pathExists(envExamplePath)) {
        await fs.copy(envExamplePath, envPath);
        await fs.remove(envExamplePath);
      }

      // .github klasörünü sil
      // Remove .github folder
      await fs.remove(path.join(projectPath, ".github"));
      await fs.remove(path.join(projectPath, "crowdin.yml;"));

      spinner.succeed(
        chalk.green`Project "${projectName}" created successfully!`
      );

      // Git repository yapılandırması için sor
      // Ask for Git repository configuration
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
        // Add remote repository
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

      // ENV yapılandırması için sor
      // Ask for ENV configuration
      const { configureEnv } = await inquirer.prompt([
        {
          type: "confirm",
          name: "configureEnv",
          message:
            "Would you like to configure the environment variables (.env) for authentication, database, and email services?",
          default: true,
        },
      ]);

      let config = {};
      if (configureEnv) {
        console.log(
          chalk.cyan`\nLet's configure your project environment variables:`
        );
        config = await inquirer.prompt([
          {
            type: "input",
            name: "DATABASE_URL",
            message: "Enter your database URL (PostgreSQL):",
            default: "postgresql://user:password@localhost:5432/dbname",
          },
          {
            type: "input",
            name: "RESEND_API_KEY",
            message: "Enter your Resend API key:",
          },
          {
            type: "input",
            name: "RESEND_AUDIENCE_ID",
            message: "Enter your Resend Audience ID:",
          },
          {
            type: "input",
            name: "RESEND_FROM_EMAIL",
            message: "Enter your Resend from email address:",
            validate: (input) => {
              const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
              return valid || "Please enter a valid email address";
            },
          },
          {
            type: "input",
            name: "UPSTASH_REDIS_REST_URL",
            message: "Enter your Upstash Redis REST URL:",
          },
          {
            type: "input",
            name: "UPSTASH_REDIS_REST_TOKEN",
            message: "Enter your Upstash Redis REST Token:",
          },
        ]);

        // AUTH_SECRET oluştur
        // Generate AUTH_SECRET
        console.log(chalk.cyan`\nGenerating AUTH_SECRET...`);
        await new Promise((resolve, reject) => {
          exec("npx auth secret", (err, stdout, stderr) => {
            if (err) {
              console.error(stderr);
              return reject(err);
            }
            resolve();
          });
        });

        // .env.local'dan AUTH_SECRET al
        // Get AUTH_SECRET from .env.local
        const envLocalPath = path.join(projectPath, ".env.local");
        if (await fs.pathExists(envLocalPath)) {
          const envLocalContent = await fs.readFile(envLocalPath, "utf8");
          const authSecretMatch = envLocalContent.match(
            /AUTH_SECRET="([^"]+)"/
          );
          if (authSecretMatch && authSecretMatch[1]) {
            config.AUTH_SECRET = authSecretMatch[1];
            await fs.remove(envLocalPath);
          }
        }
      }

      // Diğer değişkenler
      // Other variables
      const additionalEnvVars = `\n
GOOGLE_SITE_VERIFICATION=""
GOOGLE_ANALYTICS=""
YANDEX_VERIFICATION=""`;

      // .env oluştur
      // Create .env file
      if (configureEnv) {
        const envContent = Object.entries(config)
          .map(([key, value]) => `${key}="${value}"`)
          .join("\n");
        await fs.writeFile(
          path.join(projectPath, ".env"),
          envContent + additionalEnvVars
        );
        console.log(
          chalk.green`\nEnvironment variables configured successfully!`
        );
      } else {
        await fs.writeFile(
          path.join(projectPath, ".env"),
          additionalEnvVars.trim()
        );
        console.log(
          chalk.yellow`\nSkipped environment configuration. You can configure them later in the .env file.`
        );
      }

      // Paket yöneticisi seçimi
      // Package manager selection
      const { packageManager } = await inquirer.prompt([
        {
          type: "list",
          name: "packageManager",
          message: "Which package manager would you like to use?",
          choices: ["pnpm", "npm", "yarn"],
          default: "pnpm",
        },
      ]);

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

      if (confirmInstall) {
        spinner.start(
          chalk.blue`Installing dependencies with ${packageManager}...`
        );
        await new Promise((resolve, reject) => {
          exec(`${packageManager} install`, (err, stdout, stderr) => {
            if (err) {
              console.error(stderr);
              return reject(err);
            }
            resolve();
          });
        });
        spinner.succeed(chalk.green`Dependencies installed successfully!`);

        // Git repository yapılandırıldıysa ilk commit'i oluştur
        // Create initial commit if git repository is configured
        if (configureGit) {
          await new Promise((resolve, reject) => {
            exec('git add .', (err, stdout, stderr) => {
              if (err) {
                console.error(stderr);
                return reject(err);
              }
              resolve();
            });
          });

          await new Promise((resolve, reject) => {
            exec('git commit -m "feat: Initialize new Nitrokit project with basic configuration"', (err, stdout, stderr) => {
              if (err) {
                console.error(stderr);
                return reject(err);
              }
              resolve();
            });
          });
        }
      }

      console.log(chalk.yellow`\nNext steps:`);
      console.log(chalk.cyan`  cd ${projectName}`);
      if (!confirmInstall) {
        console.log(chalk.cyan`  ${packageManager} install`);
      }
      console.log(chalk.cyan`  ${packageManager} run dev`);
      console.log(chalk.yellow`\nHappy coding!`);
    } catch (error) {
      spinner.fail(
        chalk.red`Failed to create project. Please check your internet connection or try again.`
      );
      console.error(error);
      process.exit(1);
    }
  });

program.parse(process.argv);
