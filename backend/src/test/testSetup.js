import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterEach, afterAll } from "@jest/globals";

export function useMongoMemoryServer() {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: "wiredTiger" },
    });
    await mongoose.connect(mongoServer.getUri());
  }, 30000);

  afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, 30000);
}

export function useExpressServer(configureApp) {
  let server;
  const ctx = { port: 0 };

  beforeAll(async () => {
    await new Promise((resolve) => {
      server = configureApp().listen(0, resolve);
    });
    ctx.port = server.address().port;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  return ctx;
}
