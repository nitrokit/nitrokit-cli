const { execa } = require("execa");
const fs = require("fs-extra");
const path = require("path");
const ora = require("ora");
const chalk = require("chalk");

async function detectPackageManager(projectRoot) {
  if (await fs.pathExists(path.join(projectRoot, "pnpm-lock.yaml"))) return "pnpm";
  if (await fs.pathExists(path.join(projectRoot, "yarn.lock"))) return "yarn";
  if (await fs.pathExists(path.join(projectRoot, "package.json"))) return "npm";
  return null;
}

async function runUpdate(pm, mode, projectRoot) {
  const spinner = ora(`Updating dependencies with ${chalk.green(pm)} in ${chalk.cyan(mode)} mode...`).start();
  const execOptions = { cwd: projectRoot, stdio: "pipe" };

  try {
    switch (pm) {
      case "pnpm":
        if (mode === "safe" || mode === "patch") {
          await execa("pnpm", ["update"], execOptions);
        } else {
          await execa("pnpm", ["update", "--latest"], execOptions);
        }
        break;
      case "yarn":
        if (mode === "safe" || mode === "patch") {
          await execa("yarn", ["upgrade"], execOptions);
        } else {
          await execa("yarn", ["upgrade", "--latest"], execOptions);
        }
        break;
      case "npm":
        if (mode === "safe" || mode === "patch") {
          await execa("npm", ["update"], execOptions);
        } else {
          const ncuArgs = mode === "minor" ? ["--target", "minor"] : [];
          await execa("npx", ["npm-check-updates", ...ncuArgs, "--upgrade"], execOptions);
          await execa("npm", ["install"], execOptions);
        }
        break;
    }
    spinner.succeed("Dependencies updated successfully.");
  } catch (error) {
    spinner.fail("Failed to update dependencies.");
    console.error(chalk.red(error.stderr || error.stdout || error.message));
    throw error; // Propagate error to stop execution
  }
}

async function runSecurityAudit(pm, projectRoot) {
  const spinner = ora(`Running security audit with ${chalk.green(pm)}...`).start();
  const execOptions = { cwd: projectRoot, stdio: "pipe", reject: false }; // Don't throw on non-zero exit

  try {
    let auditCommand;
    switch (pm) {
      case "pnpm":
        auditCommand = await execa("pnpm", ["audit", "--audit-level=moderate"], execOptions);
        break;
      case "yarn":
        auditCommand = await execa("yarn", ["audit", "--level", "moderate"], execOptions);
        break;
      case "npm":
        auditCommand = await execa("npm", ["audit", "--audit-level=moderate"], execOptions);
        break;
    }
    spinner.succeed("Security audit completed.");
    // Sadece hem çıkış kodu 0'dan farklıysa hem de stdout'ta bir içerik varsa raporu göster
    // Show the report only if the exit code is non-zero and there is content in stdout
    if (auditCommand.exitCode !== 0 && auditCommand.stdout) {
      console.log(chalk.yellow("\n--- Audit Report ---"));
      console.log(auditCommand.stdout);
      console.log(chalk.yellow("--- End of Report ---\n"));
      console.log(chalk.yellow("Vulnerabilities found. Please review the report above."));
    } else if (auditCommand.exitCode !== 0) {
      console.log(chalk.yellow("Audit command finished with a non-zero exit code, but no vulnerabilities were reported in stdout."));
    } else {
      console.log(chalk.green("No high or critical severity vulnerabilities found."));
    }
  } catch (error) {
    spinner.fail("Security audit command failed to run.");
    console.error(chalk.red(error.message));
  }
}

async function createBackup(projectRoot) {
  const backupDir = path.join(projectRoot, ".dependency-backups");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, timestamp);

  await fs.ensureDir(backupPath);

  const filesToBackup = ["package.json", "pnpm-lock.yaml", "yarn.lock", "package-lock.json"];
  for (const file of filesToBackup) {
    const sourcePath = path.join(projectRoot, file);
    if (await fs.pathExists(sourcePath)) {
      await fs.copy(sourcePath, path.join(backupPath, file));
    }
  }
  return backupPath;
}

const updateCommand = {
  command: "update",
  description: "Update project dependencies with security checks and backups.",
  options: [
    ["-m, --mode <mode>", "Update strategy (safe|patch|minor|major)", "safe"],
    ["--no-security", "Disable security vulnerability scanning"],
    ["--no-backup", "Disable automatic backup"],
    ["--dry-run", "Preview changes without applying them (not implemented yet)"],
  ],
  action: async (options) => {
    const projectRoot = process.cwd();

    console.log(chalk.blue("🚀 Starting Nitrokit Dependency Updater..."));

    // 1. Detect Package Manager
    const pm = await detectPackageManager(projectRoot);
    if (!pm) {
      console.error(chalk.red("Error: No package manager detected. Make sure a `package.json` file exists."));
      process.exit(1);
    }
    console.log(chalk.green(`✅ Detected package manager: ${pm}`));

    // 2. Create Backup
    let backupPath = "";
    if (options.backup) {
      const spinner = ora("Creating backup...").start();
      try {
        backupPath = await createBackup(projectRoot);
        spinner.succeed(`Backup created at ${chalk.cyan(path.relative(projectRoot, backupPath))}`);
      } catch (error) {
        spinner.fail("Failed to create backup.");
        console.error(error);
        process.exit(1);
      }
    }

    // 3. Run Security Audit
    if (options.security) {
      await runSecurityAudit(pm, projectRoot);
    }

    // 4. Update Dependencies
    try {
      await runUpdate(pm, options.mode, projectRoot);
    } catch (error) {
      console.error(chalk.red("\nAn error occurred during the update process."));
      if (backupPath) {
        console.log(chalk.yellow(`A backup was created. You can manually restore files from: ${backupPath}`));
      }
      process.exit(1);
    }

    console.log(chalk.bold.green("\n🎉 Dependency update process completed successfully!"));
  },
};

module.exports = updateCommand;