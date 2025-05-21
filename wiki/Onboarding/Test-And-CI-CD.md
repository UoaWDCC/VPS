# Test and CI/CD

This is information about running unit-tests on your code, and linting your code (automatically tidying indentations and extra spaces).
This is not required for project setup but good practice to use once you start making changes.

## Instructions

1. Open terminal and `cd frontend` or `cd backend` depending on which folder you are testing
2. Run `yarn run test` to run unit tests;
3. Run `yarn run lint` to lint; Run `yarn run lint:fix` to fix linting;
4. Run `yarn run prettier` to test for prettier; Run `yarn run prettify` to fix prettier issues;

To update the Jest snapshots (e.g. when updating the UI) and pass all the frontend tests:

1. In VPS/frontend, run `yarn run test` to run unit tests;
2. Press `a` to run all tests - some may fail and if they do, press `w` to show more then `u` to update failing snapshots - all tests should pass now
3. Press `w` then `q` to exit
4. Commit the updated snapshots before opening a PR

More information on Jest snapshot testing: https://jestjs.io/docs/snapshot-testing
