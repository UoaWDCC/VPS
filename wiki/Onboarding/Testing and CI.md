# Testing and CI

This is information about running unit-tests on your code, and linting your code (automatically tidying indentations and extra spaces). This is not required for project setup but good practice to use once you start making changes.

## Instructions

1. Open terminal and `cd frontend` or `cd backend` depending on which folder you are testing
2. Run `yarn run test` to run unit tests
3. Run `yarn run lint` to lint; Run `yarn run lint:fix` to fix linting;
4. Run `yarn run prettier` to test for prettier; Run `yarn run prettier:write` to fix prettier issues;

To update the Jest snapshots (e.g. when updating the UI) and pass all the frontend tests:

1. In VPS/frontend, run `yarn run test` to run unit tests
2. Press `a` to run all tests - some may fail and if they do, press `w` to show more then `u` to update failing snapshots - all tests should pass now
3. Press `w` then `q` to exit
4. Commit the updated snapshots before opening a PR

More information on Jest snapshot testing: <https://jestjs.io/docs/snapshot-testing>

## Writing backend tests

Backend tests use an in-memory MongoDB instance. Use the shared helpers in `src/test/testSetup.js` rather than writing lifecycle boilerplate manually.

```js
import { useMongoMemoryServer, useExpressServer } from "../../../test/testSetup.js";

describe("My API tests", () => {
  useMongoMemoryServer();                      // handles DB connect/disconnect/cleanup
  const ctx = useExpressServer(() => {         // handles server start/stop
    const app = express();
    app.use("/", routes);
    return app;
  });

  it("does something", async () => {
    const response = await axios.get(`http://localhost:${ctx.port}/api/...`);
    // ...
  });
});
```

`useMongoMemoryServer()` registers `beforeAll`/`afterEach`/`afterAll` hooks that start the server, drop the database between tests, and disconnect on teardown. `useExpressServer(configureApp)` starts an Express app on a random port and returns a `ctx` object with a `port` property.
