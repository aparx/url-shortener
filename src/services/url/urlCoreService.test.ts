import { describe, expect, test } from "@jest/globals";

import { urlsTable } from "@/db";
import { testDb } from "@/db/test";
import { eq } from "drizzle-orm";
import { DefaultUrlCoreService, UrlCoreService } from "./urlCoreService";
import { DefaultUrlCrypto } from "./urlCryptography";
import { ShortenUrlData } from "./urlSchema";

describe("Full integration tests: DefaultUrlCoreService & DefaultUrlCrypto", () => {
  testService(new DefaultUrlCoreService(testDb(), new DefaultUrlCrypto()));
});

function testService(service: UrlCoreService) {
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

    test("ensure expiration is set correctly", async () => {
      // Note (*for threshold of 1000 below):
      // Since the expiration is always in minutes, ignore marginal differences
      // in seconds. This also comes down to what type of column is used.
      // By current implementation, milliseconds can be ignored or rounded when
      // stored in the database. Use `timestamp_ms` if accuracy becomes important.
      const dateBefore = Date.now();
      const [{ expiration }] = await insertAndRetrieve({
        endpoint: "http://localhost:3000",
        expireIn: 30 /* 30 minutes */,
      });
      const dateNow = Date.now();
      const expireInMs = 30 * 60 * 1000;
      expect(expiration?.getTime()).toBeGreaterThanOrEqual(
        dateBefore + expireInMs - 1000 /* threshold */,
      );
      expect(expiration?.getTime()).toBeLessThanOrEqual(
        dateNow + expireInMs + 1000 /* threshold */,
      );
      // TODO test edge case: 0 > expireIn
    });
  });

  describe("#matchesPassword", () => {
    async function insertPassword(plainPassword: string) {
      const seed = service.crypto.generateSeed();
      const [result] = await service.database
        .insert(urlsTable)
        .values({
          encryptedEndpoint: "sample-clear-endpoint",
          cryptoSeed: seed.toString(service.crypto.encoding),
          hashedPassword: service.crypto.hashPassword(plainPassword, seed),
        })
        .returning({
          path: urlsTable.path,
          hashedPassword: urlsTable.hashedPassword,
        });
      // Ensure value has been inserted
      expect(result).toStrictEqual({
        path: expect.any(String),
        // If this fails: the `hashPassword` fn MUST BE deterministic
        hashedPassword: service.crypto.hashPassword(plainPassword, seed),
      });
      return result;
    }

    test("ensure two equal passwords are matching and others do not", async () => {
      const value = await insertPassword("password");
      expect(await service.matchesPassword(value.path, "password")).toBe(true);
      expect(await service.matchesPassword(value.path, "passworD")).toBe(false);
      expect(await service.matchesPassword(value.path, "PASSWORD")).toBe(false);
      expect(
        await service.matchesPassword(value.path, value.hashedPassword!),
      ).toBe(false);
    });

    test("ensure equal passwords with special characters", async () => {
      const value = await insertPassword('@8946kf"!äö*-~ `_:;');
      expect(
        await service.matchesPassword(value.path, '@8946kf"!äö*-~ `_:;'),
      ).toBe(true);
      expect(
        await service.matchesPassword(value.path, '@8046kf"!äö*-~ `_:;'),
      ).toBe(false);
      expect(
        await service.matchesPassword(value.path, '@8946k"f!äö*-~` -:;'),
      ).toBe(false);
      expect(
        await service.matchesPassword(value.path, '@8946kf"!Äö*-~` -:;'),
      ).toBe(false);
      expect(
        await service.matchesPassword(value.path, '@8946kf"!ÄÖ*-~` -:;'),
      ).toBe(false);
    });
  });
}
