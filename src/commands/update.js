const path = require("path");
const ora = require("ora");
const chalk = require("chalk");
const {
  detectPackageManager,
  runUpdate,
  runSecurityAudit,
  createBackup,
} = require("../utils/update/helpers");

// --- Command Definition ---

const updateCommand = {
  command: "update",
  description: "Update project dependencies with security checks and backups.",
  options: [
    [
      "-m, --mode <mode>",
      "Update strategy: safe (patches), minor, or major (latest)",
      "safe",
    ],
    ["--no-security", "Disable security vulnerability scanning"],
    ["--no-backup", "Disable automatic backup"],
    [
      "--dry-run",
      "Preview changes without applying them (not implemented yet)",
    ],
  ],
  action: async (options) => {
    const projectRoot = process.cwd();

    console.log(chalk.blue("🚀 Starting Nitrokit Dependency Updater..."));

    // 1. Detect Package Manager
    const pm = await detectPackageManager(projectRoot);
    if (!pm) {
      console.error(
        chalk.red(
          "Error: No package manager detected. Make sure a `package.json` file exists."
        )
      );
      // Throw an error that can be caught by test frameworks
      throw new Error("No package manager detected.");
    }
    console.log(chalk.green(`✅ Detected package manager: ${pm}`));

    // 2. Create Backup
    let backupPath = "";
    if (options.backup) {
      const spinner = ora("Creating backup...").start();
      try {
        backupPath = await createBackup(projectRoot);
        spinner.succeed(
          `Backup created at ${chalk.cyan(
            path.relative(projectRoot, backupPath)
          )}`
        );
      } catch (error) {
        spinner.fail("Failed to create backup.");
        console.error(error);
        // Throw an error that can be caught by test frameworks
        throw new Error("Backup failed.");
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
      console.error(
        chalk.red("\nAn error occurred during the update process.")
      );
      if (backupPath) {
        console.log(
          chalk.yellow(
            `A backup was created. You can manually restore files from: ${backupPath}`
          )
        );
      }
      // Throw an error instead of calling process.exit(1) for test compatibility
      throw new Error("Dependency update failed.");
    }

    console.log(
      chalk.bold.green("\n🎉 Dependency update process completed successfully!")
    );
  },
};


module.exports = updateCommand;
