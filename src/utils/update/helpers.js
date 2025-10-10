const { execa } = require("execa");
const fs = require("fs-extra");
const path = require("path");
const ora = require("ora");
const chalk = require("chalk");

/**
 * Detects the package manager based on lock files present in the project root.
 * @param {string} projectRoot The path to the project root directory.
 * @returns {Promise<string|null>} The detected package manager ('pnpm', 'yarn', 'npm') or null.
 */
async function detectPackageManager(projectRoot) {
  if (await fs.pathExists(path.join(projectRoot, "pnpm-lock.yaml")))
    return "pnpm";
  if (await fs.pathExists(path.join(projectRoot, "yarn.lock"))) return "yarn";
  if (await fs.pathExists(path.join(projectRoot, "package.json"))) return "npm";
  return null;
}

/**
 * Runs the dependency update based on the chosen mode.
 * @param {string} pm Package manager ('pnpm', 'yarn', 'npm').
 * @param {string} mode Update mode ('safe', 'patch', 'minor', 'major').
 * @param {string} projectRoot The path to the project root directory.
 * @returns {Promise<void>}
 */
async function runUpdate(pm, mode, projectRoot) {
  const spinner = ora(
    `Updating dependencies with ${chalk.green(pm)} in ${chalk.cyan(
      mode
    )} mode...`
  ).start();
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
          await execa(
            "npx",
            ["npm-check-updates", ...ncuArgs, "--upgrade"],
            execOptions
          );
          await execa("npm", ["install"], execOptions);
        }
        break;
      default:
        throw new Error(`Unsupported package manager: ${pm}`);
    }
    spinner.succeed("Dependencies updated successfully.");
  } catch (error) {
    spinner.fail("Failed to update dependencies.");
    const errorMessage = error.stderr || error.stdout || error.message;
    console.error(chalk.red(errorMessage));
    throw error;
  }
}

/**
 * Runs a security audit.
 * @param {string} pm Package manager.
 * @param {string} projectRoot The path to the project root directory.
 * @returns {Promise<void>}
 */
async function runSecurityAudit(pm, projectRoot) {
  const spinner = ora(
    `Running security audit with ${chalk.green(pm)}...`
  ).start();
  const execOptions = { cwd: projectRoot, stdio: "pipe", reject: false };

  try {
    let auditCommand;
    switch (pm) {
      case "pnpm":
        auditCommand = await execa(
          "pnpm",
          ["audit", "--audit-level=moderate"],
          execOptions
        );
        break;
      case "yarn":
        auditCommand = await execa(
          "yarn",
          ["audit", "--level", "moderate"],
          execOptions
        );
        break;
      case "npm":
        auditCommand = await execa(
          "npm",
          ["audit", "--audit-level=moderate"],
          execOptions
        );
        break;
      default:
        spinner.succeed("Security audit skipped for unknown package manager.");
        return;
    }

    spinner.succeed("Security audit completed.");

    if (
      auditCommand.exitCode !== 0 &&
      auditCommand.stdout &&
      !auditCommand.stdout.includes("found 0 vulnerabilities")
    ) {
      console.log(chalk.yellow("\n--- Audit Report ---"));
      console.log(auditCommand.stdout);
      console.log(chalk.yellow("--- End of Report ---\n"));
      console.log(
        chalk.yellow("Vulnerabilities found. Please review the report above.")
      );
    } else if (auditCommand.exitCode !== 0) {
      console.log(
        chalk.yellow(
          "Audit command finished with a non-zero exit code, but no vulnerabilities were reported in stdout."
        )
      );
    } else {
      console.log(
        chalk.green("No moderate or high severity vulnerabilities found.")
      );
    }
  } catch (error) {
    spinner.fail("Security audit command failed to run.");
    console.error(chalk.red(error.message));
  }
}

/**
 * Creates a backup of crucial lock files.
 * @param {string} projectRoot The path to the project root directory.
 * @returns {Promise<string>} The path where the backup was created.
 */
async function createBackup(projectRoot) {
  const backupDir = path.join(projectRoot, ".dependency-backups");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, timestamp);

  await fs.ensureDir(backupPath);

  const filesToBackup = [
    "package.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "package-lock.json",
  ];
  for (const file of filesToBackup) {
    const sourcePath = path.join(projectRoot, file);
    if (await fs.pathExists(sourcePath)) {
      await fs.copy(sourcePath, path.join(backupPath, file));
    }
  }
  return backupPath;
}

module.exports = {
  detectPackageManager,
  runUpdate,
  runSecurityAudit,
  createBackup,
};