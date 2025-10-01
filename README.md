<div align="center">
  <a href="https://nitrokit.tr">
    <img alt="NitrokitCLI Logo" src="https://raw.githubusercontent.com/nitrokit/.github/refs/heads/main/profile/nitrokit.png" height="100">
  </a>

# Nitrokit CLI

<!-- BADGES_START -->[![npm version](https://img.shields.io/npm/v/nitrokit-cli.svg)](https://www.npmjs.com/package/nitrokit-cli)<!-- BADGES_END -->


A powerful and user-friendly command-line interface (CLI) to help developers quickly set up new projects using the Nitrokit boilerplate. Built with a focus on speed and ease of use, this CLI automates the project creation process and lets you choose your preferred package manager.

</div>


## ✨ Features

- **Fast Project Creation:** Quickly clone the latest Nitrokit boilerplate from the official GitHub repository.
- **Package Manager Selection:** Choose between `pnpm`, `npm`, or `yarn` to automatically set up your project's dependencies.
- **Clean Installation:** The CLI automatically removes unnecessary files, such as the `.git` directory and other lock files, ensuring a clean and fresh project start.
- **User-Friendly Interface:** Provides clear, colored output and progress spinners to guide you through the setup process.

## 🚀 Installation

You can install the Nitrokit CLI globally via your terminal.

```bash
pnpm install -g @nitrokit/nitrokit-cli
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

The CLI provides a single, simple command to get your project up and running.

`nitrokit new <project-name>`

This command creates a new project directory with the specified name and clones the Nitrokit boilerplate into it.

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
