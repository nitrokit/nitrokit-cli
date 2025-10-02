<div align="center">
  <a href="https://nitrokit.tr">
    <img alt="NitrokitCLI Logo" src="https://raw.githubusercontent.com/nitrokit/nitrokit-cli/refs/heads/main/assets/nitrokit-cli.png" height="150">
  </a>

# Nitrokit CLI

[![NPM Version](https://img.shields.io/npm/v/nitrokit-cli)](https://www.npmjs.com/package/nitrokit-cli) [![NPM Downloads](https://img.shields.io/npm/dt/nitrokit-cli.svg)](https://www.npmjs.com/package/nitrokit-cli) [![CodeFactor](https://www.codefactor.io/repository/github/nitrokit/nitrokit-cli/badge)](https://www.codefactor.io/repository/github/nitrokit/nitrokit-cli)
</div>

A powerful and user-friendly command-line interface (CLI) to help developers quickly set up new projects using the Nitrokit boilerplate. Built with a focus on speed and ease of use, this CLI automates the project creation process and lets you choose your preferred package manager.


## ✨ Features

- **Fast Project Creation:** Quickly clone the latest Nitrokit boilerplate from the official GitHub repository.
- **Package Manager Selection:** Choose between `pnpm`, `npm`, or `yarn` to automatically set up your project's dependencies.
- **Clean Installation:** The CLI automatically removes unnecessary files, such as the `.git` directory and other lock files, ensuring a clean and fresh project start.
- **User-Friendly Interface:** Provides clear, colored output and progress spinners to guide you through the setup process.
- **Language Generation:** Add new languages to your project with a single command (`nitrokit generate language`).
- **Dependency Management:** Keep your project up-to-date with a powerful `update` command that includes security audits and backups.
- **AI-Powered Translations:** Automatically translate your language files from English to other languages using Google Gemini (`nitrokit translate`).
- **Version Checking:** Automatically checks for new versions of the CLI and notifies you when an update is available.

## 🚀 Installation

You can install the Nitrokit CLI globally via your terminal.

```bash
pnpm install -g nitrokit-cli
```

or 

```bash
npm install -g nitrokit-cli
```

or 

```bash
yarn global add nitrokit-cli
```

## 💡 Usage

The CLI provides a set of commands to streamline your development workflow.

### `new`

Creates a new project directory with the specified name and clones the Nitrokit boilerplate into it.

```bash
nitrokit new my-awesome-app
```

When you run the command, you will be prompted to select your preferred package manager for dependency installation.

## 🤖 How It Works

The CLI is built with Node.js and uses the following libraries to provide a seamless experience:

- **Commander.js:** For defining the CLI commands and arguments.
- **Inquirer.js:** For creating the interactive prompt for package manager selection.
- **Chalk & Ora:** For a professional, colored, and animated terminal output.
- **fs-extra:** For handling file system operations easily and efficiently.

## 🤝 Contribution

We welcome contributions to the Nitrokit CLI! If you have suggestions for new features, bug reports, or improvements, please feel free to open an issue or submit a pull request on our GitHub repository.
