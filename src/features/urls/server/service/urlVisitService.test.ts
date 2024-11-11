import { urlsTable } from "@/database/database";
import { testDb } from "@/database/mock";
import { describe, expect, test } from "@jest/globals";
import { eq } from "drizzle-orm";
import { DefaultUrlCoreService } from "./urlCoreService";
import { DefaultUrlCrypto } from "./urlCryptography";
import { DefaultUrlVisitService, UrlVisitService } from "./urlVisitService";

describe("Full integration tests: DefaultUrlVisitService", () => {
  const coreService = new DefaultUrlCoreService({
    database: testDb(),
    crypto: new DefaultUrlCrypto({
      key: process.env.URL_ENCRYPTION_KEY!,
    }),
  });
  testService(new DefaultUrlVisitService(coreService));
});

function testService(service: UrlVisitService) {
  const { database, crypto } = service.core;

  async function createUrl(password?: string | undefined) {
    const seed = crypto.generateSeed();
    const [result] = await database
      .insert(urlsTable)
      .values({
        cryptoSeed: seed.toString(crypto.encoding),
        encryptedEndpoint: crypto.encryptUrl("https://google.com", seed),
        hashedPassword: password ? crypto.hashString(password, seed) : null,
      })
      .returning({
        path: urlsTable.path,
        encryptedEndpoint: urlsTable.encryptedEndpoint,
        cryptoSeed: urlsTable.cryptoSeed,
      });
    // Check value has been inserted
    expect(result).toStrictEqual({
      path: expect.any(String),
      encryptedEndpoint: expect.any(String),
      cryptoSeed: expect.any(String),
    });
    return result;
  }

  test("ensure null is returned with unknown path", async () => {
    expect(await service.logVisitAndDecryptEndpoint("some-path")).toBeNull();
  });

  test("ensure endpoint is decrypted correctly", async () => {
    const { path, encryptedEndpoint, cryptoSeed } = await createUrl();
    const plainEndpoint = await service.logVisitAndDecryptEndpoint(path);
    expect(plainEndpoint).toBeDefined();
    const seedBuf = Buffer.from(cryptoSeed, crypto.encoding);
    expect(plainEndpoint).toBe(crypto.decryptUrl(encryptedEndpoint, seedBuf));
  });

  test("ensure visit count is undone when decryption fails", async () => {
    // In order to provoke an issue with decryption, store invalid seed
    const ogSeed = crypto.generateSeed();

    const [result] = await database
      .insert(urlsTable)
      .values({
        cryptoSeed: "<invalid-seed>",
        encryptedEndpoint: crypto.encryptUrl("https://google.com", ogSeed),
        visits: 3 /* PRE_LOG_VISITS */,
      })
      .returning({
        path: urlsTable.path,
      });
    expect(result).toBeDefined(); // Ensure value is given
    await expect(
      async () => await service.logVisitAndDecryptEndpoint(result.path),
    ).rejects.toThrowError();
    const [{ visits }] = await database
      .select({ visits: urlsTable.visits })
      .from(urlsTable)
      .where(eq(urlsTable.path, result.path));
    expect(visits).toBe(3 /* PRE_LOG_VISITS */);
  });

  test("ensure visit counter is increased by one (sequential)", async () => {
    const { path } = await createUrl();
    for (let i = 0; i < 10 /* SIMULATION_COUNT */; ) {
      // For each decryption, expect the visit counter to increase by 1
      await service.logVisitAndDecryptEndpoint(path);
      const [result] = await database
        .select({ visits: urlsTable.visits })
        .from(urlsTable)
        .where(eq(urlsTable.path, path));
      expect(result?.visits).toBeDefined();
      expect(result.visits).toBe(++i);
    }
  });

  test("ensure visit counter is increased by one (parallel)", async () => {
    const { path } = await createUrl();
    await Promise.all(
      Array.from({ length: 10 }, () => {
        return service.logVisitAndDecryptEndpoint(path);
      }),
    );
    const [result] = await database
      .select({ visits: urlsTable.visits })
      .from(urlsTable)
      .where(eq(urlsTable.path, path));
    expect(result?.visits).toBe(10);
  });
}
