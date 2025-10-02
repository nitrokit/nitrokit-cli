const chalk = require("chalk");
const boxen = require("boxen");
const latestVersion = require("latest-version");
const semver = require("semver");

async function checkForUpdates(pkg) {
  try {
    const latest = await latestVersion(pkg.name);
    if (semver.gt(latest, pkg.version)) {
      const updateCommands = `
To update, run one of the following:
${chalk.bold.cyan(`npm install -g ${pkg.name}`)}
${chalk.bold.cyan(`pnpm add -g ${pkg.name}`)}
${chalk.bold.cyan(`yarn global add ${pkg.name}`)}
`;
      const updateMessage = boxen(
        `A new version of ${chalk.bold.cyan(pkg.name)} is available!
Current: ${chalk.dim(pkg.version)} | Latest: ${chalk.green(latest)}
${updateCommands}`,
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "yellow",
          textAlign: "center",
        }
      );
      console.log(updateMessage);
    }
  } catch (error) {
    // Ignore errors (e.g., user is offline)
  }
}

module.exports = checkForUpdates;