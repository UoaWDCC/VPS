# SOFTENG750 Group 20 - Copper Crocodile

<!-- prettier-ignore -->
# cc.gg - League of Legends Player Stats

With the rise of sports competition using video games, named Esports, and the fast growing gaming industry, the need to easily monitor one's game performance has never been more important. To improve the player's gaming experience, we aim to design and develop an interactive and live dashboard web application for League of Legends (LoL), cc.gg. Players can view their recent performances and scout their game statistics for improvement. Furthermore, the web application offers communication with their friends (who also have the web application) without having to login to the game, to arrange LoL sessions for practice or for general entertainment.

## Features

The features of cc.gg include the Dashboard and the Friends List.

### Sidebar

On the left side, there is a sidebar containing the logo of 'cc.gg', a Home button to return to the Dashboard screen, a Friends List button to go to the Friends List page, a Settings icon to change the linked summoner and a Logout button at the bottom.

### Dashboard

cc.gg's Dashboard provides an overview of the logged-in player's statistics of their most recent LoL matches, providing a fun and interactive visual experience to view how they can improve for later matches.

Firstly, it shows the player's profile icon and their name, as well as an Update button to refresh the data shown on the page.

The two top-right cards show the player's Ranked Solo and Ranked Flex statistics, with their winrate, tier and their total number of games played in that mode.

Below that is the player's best champions for the Ranked, Normal and Other gamemodes. For each champion under a gamemode, their statistics of their recent games are aggregated. These statistics include their average Creep Score (CS), Kill/Death/Assists (KDA) and the KDA ratio, their winrate and number of games played.

The Recent Performance card shows the win ratio of the player's last 10 days of gameplay. It is displayed in both a pie chart and a bar graph. It can be filtered by the different game modes (Ranked Solo, Ranked Flex, Normal, All Random All Mid (ARAM)).

The Recent Matches card shows a variety of data regarding the last matches played by the player. These include the type of game (Ranked Solo, Normal, etc.), when it was played in relative time (e.g. 2 hours ago, 2 days ago), whether it was a win or a loss, the game duration, the champion you played with the level, summoner spells, runes, KDA, CS, items, vision score and the other participants. If you have scored a Double, Triple, Quadra or a Penta kill, it would be shown. The background color of a recent match will change depending on if the match was a win or a loss. You can also filter these by the gamemode (Ranked, Normal, etc.).

### Friends List

For connectivity among friends, users should be able to ping friends to see if they want to play a game or not. This communication assumes they have a login for the web application.

Upon navigating to the friends list, there is a list of your friends on the app and a field on top to add in a new friend. There is a 'Ping' button on the right side, which upon clicking, sends a Ping notification to the friend's cc.gg page, showing them that you want to play a game.

## How to Run

It is recommended to use `npm version = ^7` and `node version = ^14` when running this project as these are the versions we used for development. This is just a warning in case `npm version = ^6` or previous versions of `node` fail to work.

The backend should be started first, before the frontend.

### Dummy User
Our app uses authentication from Auth0. For non-league of legends players, we have created a dummy user for you to be able to access the features.

```
email: ccgg@gmail.com
username: ccGG1234
password: ccGG1234
```

### Start the backend

To locally start, ensure you are in the root directory and run `npm start`. A message displaying `Connected to MongoDB` will be on the console for a successful start.

### Start the frontend

To locally start, ensure you are in the frontend directory `cd frontend` and run `npm start`. This will open `localhost:3000` on your browser.

## How to Test

Tests for both the backend and frontend have been made. These are tested separately.

### Test the backend

Ensure you are in the root directory and use `npm run test`. Ensure that the backend (port 3001) is currently not running locally.

### Test the frontend

Ensure you are in the frontend directory by using `cd frontend` and use `npm run test`.

### GitHub Actions
We have used a CI workflow to ensure the current codebase is free of errors by testing and linting upon every pull request and push to master.

| CI                  | Status                                                                                                                                                                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tests               | [![Tests](https://github.com/lucas2005gao/Group-20-Copper-Crocodile/actions/workflows/tests.yml/badge.svg)](https://github.com/lucas2005gao/Group-20-Copper-Crocodile/actions/workflows/tests.yml)                                           |
| ESLint and Prettier | [![ESLint and Prettier](https://github.com/lucas2005gao/Group-20-Copper-Crocodile/actions/workflows/eslint_and_prettier.yml/badge.svg)](https://github.com/lucas2005gao/Group-20-Copper-Crocodile/actions/workflows/eslint_and_prettier.yml) |

# Technologies used in this project
## Development/Implementation
The team used the MERN stack to develop the frontend and backend of cc.gg

### React
The main techology used when delevoping our project's frontend was React. This JavaScript library was taught in lectures and those teachings were the baseline of our implementation. In terms of what was applyed, the team mostly followed the practices taught in class e.g. routing, useState(), functional components etc. Though at times we used derived from those practices in favor of techniques we were more comfortable with e.g. Fetch over Axios.

To complement React, we used additional libraries/packages when developing the GUI. Firstly, `Material-UI` was used extensively in our design. It allowed for easy development of smaller components and helped keep the look and feel of the application consistent. To create the graphs that displayed recent match results, the `@devexpress/dx-react` package made by [DevExtreme Reactive](https://devexpress.github.io/devextreme-reactive/react/chart/) was used.

### Node/Express
Node was used in combination with the Express application framework in order to develop our backend API server. The role of our backend server was to handle any requests for Riot/LoL information and friend and user management requests. To facilitate these a variety of npm packages were used. A package called `riot-lol-api` was pivotal in the development as it was what we used to actually query the official Riot API for data. The reason for this is because of the Riot API's rate limiting, which restricted our requests to 20/second or 100/2minutes. The `riot-lol-api` kept track of the rate limiting when used for requesting which reduced errors and prevented our API key from being blacklisted. Another package was `mongoose`. `mongoose` was what we used to connect to our MongoDB database and through it we were able to perform queries for data retrieval or manipulation.

### MongoDB
MongoDB, specifically `MongoDB Cloud Atlas` was what we used as our database. This allowed the team to share a common database when developing. In the DB, we stored a collection of Users. This is because, cc.gg has authenticated members and it is important to keep track of the users and their corresponding LoL accounts. Alongside this was a Match schema. Due to the Riot API's request throttling, we needed to ensure bulk requests were kept to a minimum. Since retrieving n matches of data results in n + 1 requests, we decided to store a player's match data to reduce request congestion from our application.

### auth0
Since our application kept track of users, we needed authentication/authorisation mechanisms to protect any sensitive data. To do this, the team implemnted `auth0`, by following online resources such as [tutorials](https://auth0.com/blog/complete-guide-to-react-user-authentication/) and [documentation](https://auth0.com/docs/hooks/extensibility-points/pre-user-registration). When using this, we customised the login page to suit our application and implemented JWT checks in the backend to protect our API server routes.

## Testing
### Frontend
When testing the frontend, Jest was configured to be our main testing framework. It was mostly used alongside `react-test-renderer` in order for us to perform snapshot testing of individual components. However, some of our componentes required slightly more refined tests which is where the `react testing library` comes in. Using this library, we would check if certain child components where correctly, dynamically rendered depending on some dummy data.

### Backend
To test our backend api endpoints and database schemas, jest was used with `mongodb-memory-server`. This allowed us to test queries to a memory database in order to not disrupt out actual cloud DB. Using this, we could code (Schemas, certain endpoints etc) that was related to and used mongoose/MongoDB e.g. was /api/riot/match crrectly retrieving match data. We also mocked a JWT token to allow us to check whether or not our authentication system was working for our endpoints. 

### Manual Testing
Unfortunately not everything could be tested due to time constraints and difficulty. However, to mitigate any damages, we would manually test everything we could not automate e.g. using `riot-lol-api` over traditional `axios` calls made it very difficult for us to test those endpoints that relied on the package. When manually testing, we would examine inputs and outputs from our browsers + chrome dev tools, and also [Postman](https://www.postman.com/) for certain cases. Though due to our configured linting, you won't be able to see much evidence in terms of console.log() etc.

## Other technologies
### Github + Github Actions
GitHub along with Git was the teams primary method of version control. Through Github, we would keep track of tasks and contributions through Issues and Pull requests, and the use of Git allowed everyone to easily collaborate on the same project. We also utilised Github actions to perform Continuous Integration as it allowed us to run our tests whenever a commit was made to a pull request or the master branch.

### Linting + Prettier
Linting and pretteir was configured to ensure that everyone on the team was writing clear, consistent code that was clean and correct.

### Heroku
Finally, Heroku was used to deploy our application.

## Known Issues

`Warning: findDOMNode is deprecated in StrictMode.`
This is an error in the inner components of the Chart and Transition components. However, we cannot solve this. The developers of the dependencies have addressed this here. https://github.com/DevExpress/devextreme-reactive/issues/2727
