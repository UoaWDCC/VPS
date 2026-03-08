# Setting Up a Local Build

Unfortunately, due to VPS having being worked on since 2021, it is quite a large repository and can be complex to run on a developer’s local machine. Here, some steps are outlined to (hopefully) make it easier for new devs to get up and running.

## Downloading Packages

VPS runs in the MERN stack (MongoDB, Express, React, and NodeJS), and thus it is required to download a few tools to run this.

There are also a few recommended tools to download, for ease of use, version control, and code editing.

### Node

Node is an open-source, cross-platform JavaScript runtime environment that allows developers to execute JavaScript code server-side.

If using nvm (see below), it can be installed by running `nvm install 20` or it can be downloaded from the node website (note that clicking ‘download’ on this website installs the latest version of Node (currently 20 but will not be for long), so go to previous releases). To verify it installed successfully, run `node --version` in the terminal.

#### Versions of Node/NVM

However, Node has many different versions available. Previously, due to dependency issues, this codebase had to run on Node versions of 14.17.*. However, the Tech Lead for 2024 Woo Jin Lee heroically migrated the codebase to Node v20 and replaced the now-deprecated `create-react-app` with Vite (and also added Tailwind CSS).

In order to easily switch between Node versions (especially recommended if you are using Node for other projects as well), it is recommended to install nvm (Node Version Manager) which allows you to have multiple versions of Node on your machine simultaneously. This can be downloaded:

- Windows: <https://github.com/coreybutler/nvm-windows>
- Mac/Linux/WSL: <https://github.com/nvm-sh/nvm> or by running `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh` in the terminal

For extra info on nvm installation, see [this link](https://www.freecodecamp.org/news/node-version-manager-nvm-install-guide/).

To check if nvm installed correctly, run the command `nvm --version` in the terminal.

### NPM and Yarn

NPM, which stands for Node Package Manager, is the default package manager for Node.js. It is a command-line tool that allows developers to install, share, and manage dependencies for their Node.js projects. Note that this is different to NVM (Node Version Manager, mentioned above).

NPM should install automatically when you install Node, and this can be checked by running the terminal command: `npm --version`.

It is recommended to use an NPM version similar to 10.8.2 (which is the version automatically installed with Node v20)

Yarn is a package manager for JavaScript that serves as an alternative to npm (basically it is was a “better” version of NPM which we use to manage our repo).

This project works with Yarn 1.22.21, which can be installed by running the following terminal command: `npm install -g yarn@1.22.21`.

If you already have yarn installed, uninstall it via `npm uninstall -g yarn` (note this prevents you from using the current version of Yarn in any other projects simultaneously).

To check it installed successfully, run the command `yarn --version`.

## GitHub

Our remote repository is stored on GitHub, requiring you to have installed git and have a GitHub account to access it.

Git can be installed from this link, and you can sign up for a GitHub account here.

## Other Tools

These tools are not mandatory, but may help with the developer experience when coding and running this project.

### VS Code

No matter what, you will need a text editor to open and edit code files. The most commonly used (and recommended by us) is VSCode, but you are free to use any text editor or IDE you are comfortable with.

### Fork

Fork is a git client which often makes certain version control issues easier to manage (everything from fetching, pushing and pulling to resolving merge conflicts). It can be downloaded here - it says it costs $59.99 but you can get the free evaluation, which lasts forever (no need to enter any credit card details). 

## Creating A Local Build

In order to make changes to this code base, and check that the changes work - it is required to download the remote repository onto your machine. This then allows you to run the code locally, actually generating the webpage on *localhost*- which allows you to manually test the features you create/update.

These steps should be done after downloading the required packages to run the code base, but alternatively you can clone the remote repo (the first step) before downloading these packages, running everything in the root directory.

### Downloading the Remote Repo

This is done by navigating to the directory you want to place the project folder in, then running the terminal command:

git clone https://github.com/UoaWDCC/VPS.git.

### Setting up your environment (.env) files

Environment (.env) files are the files keeping any sensitive information, and are not stored on the code base. There are 2 .env files for this project, one for the frontend and one for the backend. The frontend one goes in VPS/frontend and the backend one goes in VPS/backend.

Create a copy of the frontend and backend .env files (located on the drive) and place them at the same level as the .env.example file in frontend/ and backend/. Make sure you rename these files to .env and that they are saved as environment files, not text files.

Get the values for each key in the .env files using the links provided in them + any login details provided by the PM/TL (this may not be necessary if they are already updated).

In the frontend .env file, add `VITE_SERVER_URL = "http://localhost:[BACKEND_PORT_NUMBER]/"` and replace `BACKEND_PORT_NUMBER` with the value of `PORT` in the backend .env file, e.g. 5001

> [!WARNING]
> DO NOT share the .env file with anyone or upload it to GitHub or anywhere else - the file basically gives access to our databases which contain all the website assets and user information

### Running a local build

There are 2 methods you can use to run the local build for VPS, with both being fine to use. Method 1 is easier and quicker, while method 2 allows you to load the frontend and backend separately (if wanted).

#### Method 1

- Run yarn install in the root directory (of the project)
- Run yarn run setup in the root directory (installs dependencies for frontend and backend directories)
- Run yarn run dev in the root directory to start both frontend and backend environments to run the app

#### Method 2

- Open two terminals
- Change directory by running cd frontend and cd backend in each terminal
- Run yarn install in each terminal
- Run yarn start in each terminal to run the app
