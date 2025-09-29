const inquirer = require("inquirer");
const { exec } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");

async function configureEnv(projectPath) {
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
    console.log(chalk.cyan`\nLet's configure your project environment variables:`);
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
    const envLocalPath = path.join(projectPath, ".env.local");
    if (await fs.pathExists(envLocalPath)) {
      const envLocalContent = await fs.readFile(envLocalPath, "utf8");
      const authSecretMatch = envLocalContent.match(/AUTH_SECRET="([^"]+)"/);
      if (authSecretMatch && authSecretMatch[1]) {
        config.AUTH_SECRET = authSecretMatch[1];
        await fs.remove(envLocalPath);
      }
    }
  }

  // Diğer değişkenler
  const additionalEnvVars = `\n
GOOGLE_SITE_VERIFICATION=""
GOOGLE_ANALYTICS=""
YANDEX_VERIFICATION=""`;

  // .env oluştur
  if (configureEnv) {
    const envContent = Object.entries(config)
      .map(([key, value]) => `${key}="${value}"`)
      .join("\n");
    await fs.writeFile(
      path.join(projectPath, ".env"),
      envContent + additionalEnvVars
    );
    console.log(chalk.green`\nEnvironment variables configured successfully!`);
  } else {
    await fs.writeFile(path.join(projectPath, ".env"), additionalEnvVars.trim());
    console.log(
      chalk.yellow`\nSkipped environment configuration. You can configure them later in the .env file.`
    );
  }
}

module.exports = configureEnv;