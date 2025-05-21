# Running A Local Build

In order to make changes to this codebase, and check that the changes work - it is required to donwnload the remote repository onto your machine. This then allows you to run the code locally, actually generating the webpage on _localhost_- which allowxs you to manually test the features you create/update.

These steps should be done after downloading the required packages to run the codebase, but alternatively you can clone the remote repo (the first step) before downloading these packages, running everything in the root directory.

## Downloading the Remote Repo

This is done by navigating to the directory you want to place the project folder in, then running the terminal command:
`git clone https://github.com/UoaWDCC/VPS.git`.

## Setting up your environment (.env) files

Environment (.env) files are the files keeping any sensitive information, and are not stored on the codebase. There are 2 .env files for this project, one for the frontend and one for the backend. The frontend one goes in `VPS/frontend` and the backend one goes in `VPS/backend`.

Create a copy of the frontend and backend .env files [here](https://drive.google.com/drive/folders/19uZHA0lMrvc7QaM2dtE-DkS7veVriYZ_) (ask the TL or PM for access) and place them at the same level as the .env.example file in **frontend/** and **backend/**. Make sure you rename these files to `.env` and that they are saved as env files, not text files.
Get the values for each key in the .env files using the links provided in them + any login details provided by the PM/APM (this may not be necessary if they are already updated).

In the frontend .env file, add `REACT_APP_SERVER_URL = "http://localhost:[BACKEND_PORT_NUMBER]/"` and replace `[BACKEND_PORT_NUMBER]` with the value of `PORT` in the backend .env file e.g. 5001

⚠️ DO NOT share the .env file with anyone or upload it to GitHub or anywhere else - the file basically gives access to our databases which contain all the website assets and user information (including yours)

## Running a local build

There are 2 methods you can use to run the local build for VPS, with both being fine to use. Method 1 is easier and quicked, while method 2 allows you to load the frontend and backend separately (if wanted).

## Method 1

- Run `yarn install` in the root directory (of the project)
- Run `yarn run init` in the root directory (installs dependencies for `frontend` and `backend` directories)
- Run `yarn run dev` in the root directory to start both `frontend` and `backend` environments to run the app

## Method 2

- Open two terminals
- Change directory by running `cd frontend` and `cd backend` in each terminal
- Run `yarn install` in each terminal
- Run `yarn start` in each terminal to run the app
