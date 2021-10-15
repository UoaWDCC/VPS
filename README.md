# SOFTENG761 - Team1

![Faculty of Medicine and Health Science](https://i.ibb.co/HVLhJLC/1546995300879.png)

This project aims to provide Medical and Health Science students at the University of Auckland with a tool that supports interactive and immersive education through virtual patient scenarios.

This project is associated with The University of Auckland SOFTENG 761.

# Live deployments

Frontend: https://vps-uoa.netlify.app

Wiki: https://vps-uoa-wiki.netlify.app

Backend: https://virtual-patient-system.herokuapp.com/

<!-- prettier-ignore -->
| CI                  | Status   |
| ------------------- | -------- |
| ESLint              | [![ESLint](https://github.com/SoftEng761-2021/project-project-team-1/actions/workflows/eslint.yml/badge.svg)](https://github.com/SoftEng761-2021/project-project-team-1/actions/workflows/eslint.yml) |
| Prettier            | [![Prettier](https://github.com/SoftEng761-2021/project-project-team-1/actions/workflows/prettier.yml/badge.svg)](https://github.com/SoftEng761-2021/project-project-team-1/actions/workflows/prettier.yml) |
| Tests               |  [![Tests](https://github.com/SoftEng761-2021/project-project-team-1/actions/workflows/unit_tests.yml/badge.svg)](https://github.com/SoftEng761-2021/project-project-team-1/actions/workflows/unit_tests.yml) |
| Contributors        | [![All Contributors](https://img.shields.io/badge/all_contributors-8-orange.svg?style=flat-square)](#contributors-) |

# Setup and Run App

### Setup

- Run `yarn install` in the root directory
- Run `yarn run init` in the root directory (installs dependencies for `frontend` and `backend` directories)

Alternative way to set up

- Open two terminals
- Change directory by running `cd frontend` and `cd backend` in each terminal
- Run `yarn install` in the each terminal

### Run

- Run `yarn run dev` in the root directory to start both `frontend` and `backend` environments

Alternative way to run app

- Open two terminals
- Change directory by running `cd frontend` and `cd backend` in each terminal
- Run `yarn start` in the each terminal

### Test and Continuous Integration

- Open terminal and `cd frontend` or `cd backend` depending on which folder you are testing
- Run `yarn run test` to run unit tests;
- Run `yarn run lint` to lint; Run `yarn run lint:fix` to fix linting;
- Run `yarn run prettier` to test for prettier; Run `yarn run prettify` to fix prettier issues;

### Tool versions

- Ideally you should use the following versions to make this repository work.
- node v14.17.\*
- yarn 1.22.\*
- NPM 6.14.\*

# File Structure

```.
├── frontend/
│ └── src
│ └── package.json
├── backend/
│ └── src
│ └── package.json
├── wiki/
│ ├── react-movable.md
│ └── ...
├── README.md
├── package.json
└── ...
```

## Wiki documentation

Our wiki is is easily viewable through: https://vps-uoa-wiki.netlify.app

(Note: links to some images are broken due to CORS issues)

## Coding Conventions

### Commit message

[VPS-000] Your commit message

### Branch Name

VPS-000/description-of-the-story

# Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/lucas2005gao"><img src="https://avatars.githubusercontent.com/u/48196609?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Lucas Gao</b></sub></a><br /><a href="https://github.com/lucas2005gao/REACT Template/commits?author=lucas2005gao" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/flexzy"><img src="https://avatars.githubusercontent.com/u/49087744?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Felix Yang</b></sub></a><br /><a href="https://github.com/lucas2005gao/REACT Template/commits?author=flexzy" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/David-Xia0"><img src="https://avatars.githubusercontent.com/u/50573329?v=4?s=100" width="100px;" alt=""/><br /><sub><b>David Xiao</b></sub></a><br /><a href="https://github.com/lucas2005gao/REACT Template/commits?author=David-Xia0" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/zyan225"><img src="https://avatars.githubusercontent.com/u/52368549?v=4?s=100" width="100px;" alt=""/><br /><sub><b>zyan225</b></sub></a><br /><a href="https://github.com/lucas2005gao/REACT Template/commits?author=zyan225" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/dongmeilim"><img src="https://avatars.githubusercontent.com/u/52555301?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Dong Mei Lim</b></sub></a><br /><a href="https://github.com/lucas2005gao/REACT Template/commits?author=dongmeilim" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/annithinggoes"><img src="https://avatars.githubusercontent.com/u/52563454?v=4?s=100" width="100px;" alt=""/><br /><sub><b>annithinggoes</b></sub></a><br /><a href="https://github.com/lucas2005gao/REACT Template/commits?author=annithinggoes" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/afei088"><img src="https://avatars.githubusercontent.com/u/60560589?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Andrew Fei</b></sub></a><br /><a href="https://github.com/lucas2005gao/REACT Template/commits?author=afei088" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/NatalyMartini"><img src="https://avatars.githubusercontent.com/u/79951216?v=4?s=100" width="100px;" alt=""/><br /><sub><b>NatalyMartini</b></sub></a><br /><a href="#business-NatalyMartini" title="Business development">💼</a> <a href="#content-NatalyMartini" title="Content">🖋</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

```

```
