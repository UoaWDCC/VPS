# Downloading Packages

VPS runs in the MERN stack (MongoDB, Express, React, and NodeJS), and thus it is required to download a few tools to run this.
There are also a few recommended tools to download, for ease of use, version control, and code editing.


## Node

Node is an open-source, cross-platform JavaScript runtime environment that allows developers to execute JavaScript code server-side.
If using nvm (see below), it can be installed by running `nvm install 20` or it can be downloaded [from the node website](https://nodejs.org/en) (note that clicking 'download' on this website installs the current version of Node instead of Node v20, so go to previous releases). To verify it installed successfully, run `node --version` in the terminal.

### Versions of Node/NVM

However, Node has many different versions available. This codebase has been developed on Node version of 20.

In order to easily switch between Node versions (especially recommended if you are using Node for other projects as well), it is recommended to install nvm (Node Version Manager) which allows you to have multiple versions of Node on your machine simultaneously. This can be downloaded:
Windows: [https://github.com/coreybutler/nvm-windows](https://github.com/coreybutler/nvm-windows)
Mac/Linux/WSL: [https://github.com/nvm-sh/nvm](https://github.com/nvm-sh/nvm) or by running `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh` in the terminal
For extra info on nvm installation, see [this link](https://www.freecodecamp.org/news/node-version-manager-nvm-install-guide/)
To check nvm installed correctly, run the command `nvm --version` in the terminal.

## NPM and Yarn

NPM, which stands for Node Package Manager, is the default package manager for Node.js. It is a command-line tool that allows developers to install, share, and manage dependencies for their Node.js projects. Note that this is different to NVM (Node Version Manager, mentioned above).
NPM should install automatically when you install Node, and this can be checked by running the terminal command: `npm --version`.

Yarn is a package manager for JavaScript that serves as an alternative to npm (basically it is a better version of NPM which we use to manage our repo).
This project works with Yarn 1.22.21, which can be installed by running the following terminal command: `npm install -g yarn`.
If you already have yarn installed, uninstall it via `npm uninstall -g yarn` (note this prevents you from using the current version of Yarn in any other projects simultaneously).
To check it installed successfully, run the command `yarn --version`. 

## Github

Our remote repository is stored on Github, requiring you to have installed git and have a github account to access it.
Git can be installed from [this link](https://git-scm.com/downloads), and you can sign up for a github account [here](https://github.com).

## Other Tools

These tools are not mandatory, but may help with the developer experience when coding and running this project.

## VS Code
No matter what, you will need a text editor to open and edit code files. The most commonly used (and recommended by us) is [VSCode](https://code.visualstudio.com/download), but you are free to use any text editor or IDE you are comfortable with.

## Fork
Fork is a git client which often makes certain version control issues easier to manage (everything from fecthing, pushing and pulling to resolving merge conflicts). It can be downloaded [here](https://git-fork.com/) - it says it costs $59.99 but you can get the free evaluation, which lasts forever (no need to enter any credit card details). 
