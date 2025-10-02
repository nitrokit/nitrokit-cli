const { exec } = require("child_process");

async function createInitialCommit() {
  // Git add
  await new Promise((resolve, reject) => {
    exec('git add .', (err, stdout, stderr) => {
      if (err) {
        console.error(stderr);
        return reject(err);
      }
      resolve();
    });
  });

  // Git commit
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

module.exports = createInitialCommit;