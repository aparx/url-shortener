import { memoize } from "@/utils";
import { beforeAll } from "@jest/globals";
import { createClient } from "@libsql/client/sqlite3";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterEach } from "node:test";
import { Database, urlsTable } from ".";

export const testDb = memoize(() => {
  if (process.env.NODE_ENV !== "test")
    throw new Error("testDb is only available in test environment");
  const client = createClient({ url: ":memory:" });
  return drizzle(client) as Database;
});

beforeAll(async () => {
  await migrate(testDb(), { migrationsFolder: "./drizzle/" });
});

afterEach(async () => {
  // Clear all data from tables after each test
  await testDb().delete(urlsTable).all();
});
