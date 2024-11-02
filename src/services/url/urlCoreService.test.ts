import { afterEach, beforeAll, describe, expect, test } from "@jest/globals";
import { randomBytes } from "crypto";
import { drizzle } from "drizzle-orm/libsql";

import { Database, urlsTable } from "@/db";
import { createClient } from "@libsql/client/sqlite3";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/libsql/migrator";
import { DefaultUrlCoreService, UrlCoreService } from "./urlCoreService";
import { DefaultUrlCrypto } from "./urlCryptography";
import { ShortenUrlData } from "./urlSchema";

const client = createClient({ url: ":memory:" });
const db = drizzle(client) as Database;

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./drizzle/" });
});

afterEach(async () => {
  // Clear all data from tables after each test
  await db.delete(urlsTable).all();
});

describe("Full integration tests: DefaultUrlCoreService & DefaultUrlCrypto", () => {
  const key = randomBytes(32).toString("base64");
  doTest(new DefaultUrlCoreService(db, new DefaultUrlCrypto({ key })));
});

function doTest(service: UrlCoreService) {
  describe("#resolve", () => {
    test("ensure null is returned, due to unknown path", async () => {
      expect(await service.resolve("sample-path")).toBeNull();
    });

    test("ensure secure fields are omitted and `hasPassword` is true", async () => {
      // Ensure following fields are omitted:
      // - cryptoSeed, encryptedEndpoint, hashedPassword
      const [{ id, path }] = await service.database
        .insert(urlsTable)
        .values({
          cryptoSeed: "<this-should-be-omitted(seed)>",
          encryptedEndpoint: "<this-should-be-omitted(ep)>",
          hashedPassword: "<this-should-be-omitted(pw)>",
        })
        .returning({
          id: urlsTable.id,
          path: urlsTable.path,
        });
      expect(await service.resolve(path)).toStrictEqual({
        id,
        path,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        expiration: null,
        once: false,
        disabled: false,
        hasPassword: 1,
        visits: 0,
      });
    });

    test("ensure `hasPassword` is false", async () => {
      const [{ id, path }] = await service.database
        .insert(urlsTable)
        .values({
          cryptoSeed: "<this-should-be-omitted(seed)>",
          encryptedEndpoint: "<this-should-be-omitted(ep)>",
        })
        .returning({
          id: urlsTable.id,
          path: urlsTable.path,
        });
      // No need to verify secure fields are omitted (done in separate test)
      expect(await service.resolve(path)).toEqual(
        expect.objectContaining({
          path,
          id,
          hasPassword: 0,
        }),
      );
    });
  });

  describe("#shortenUrl", () => {
    async function insertAndRetrieve(data: ShortenUrlData) {
      const path = await service.shortenUrl(data);
      const [result] = await service.database
        .select()
        .from(urlsTable)
        .where(eq(urlsTable.path, path));
      expect(result).toBeDefined(); // Check URL is actually inserted
      return [
        result,
        Buffer.from(result.cryptoSeed, service.crypto.encoding),
      ] as const;
    }

    test("ensure returns valid `path` & `endpoint` using its crypto", async () => {
      const [result, seedBuffer] = await insertAndRetrieve({
        endpoint: "http://localhost:3000",
        path: "sample-path",
      });
      expect(result).toEqual(
        expect.objectContaining({
          path: "sample-path",
          encryptedEndpoint: service.crypto.encryptUrl(
            "http://localhost:3000",
            seedBuffer,
          ),
          cryptoSeed: seedBuffer.toString(service.crypto.encoding),
          hashedPassword: null,
          once: false,
          expiration: null,
          disabled: false,
          visits: 0,
        }),
      );
    });

    test("ensure respects lack of `path` and supports `password`", async () => {
      const [result, seedBuffer] = await insertAndRetrieve({
        endpoint: "http://localhost:3000",
        password: "sample-password",
      });
      expect(result).toBeDefined(); // Check URL is actually inserted
      expect(result).toEqual(
        expect.objectContaining({
          path: expect.any(String),
          hashedPassword: service.crypto.hashPassword(
            "sample-password",
            seedBuffer,
          ),
          once: false,
          expiration: null,
          disabled: false,
          visits: 0,
        }),
      );
    });

    test("ensure `once` is supported and inserted as true", async () => {
      const [result] = await insertAndRetrieve({
        endpoint: "http://localhost:3000",
        once: true,
      });
      expect(result).toEqual(
        expect.objectContaining({
          path: expect.any(String),
          hashedPassword: null,
          once: true,
          expiration: null,
          disabled: false,
          visits: 0,
        }),
      );
    });
  });
}
