import { expect, test } from "@jest/globals";
import { randomBytes } from "crypto";
import { describe } from "node:test";
import { DefaultUrlCrypto } from "./urlCryptography";

describe("DefaultUrlCrypto", () => {
  test("ensure error with key of different encoding", () => {
    expect(
      () => new DefaultUrlCrypto({ key: randomBytes(32).toString("hex") }),
    ).toThrow();
    expect(
      () => new DefaultUrlCrypto({ key: randomBytes(32).toString("binary") }),
    ).toThrow();
  });

  // Base64 encoded key;
  describe("with randomly generated key (check for determinism)", () => {
    function createCrypto() {
      const key = randomBytes(32).toString("base64");
      return new DefaultUrlCrypto({ key });
    }

    describe("#encryptUrl", () => {
      const crypto = createCrypto();
      const iv = crypto.generateSeed();
      test("encrypted does not equal clear text", () => {
        expect(crypto.encryptUrl("hello world", iv)).not.toEqual("hello world");
      });

      test("ensure initialization vector is respected", () => {
        const fooBar = crypto.encryptUrl("foo bar", iv);
        expect(fooBar).toEqual(crypto.encryptUrl("foo bar", iv));
        const newIv = crypto.generateSeed();
        // Ensure #generateSeed did not return equal content bytes
        expect(iv.toString(crypto.encoding)).not.toEqual(
          newIv.toString(crypto.encoding),
        );
        expect(fooBar).not.toEqual(crypto.encryptUrl("foo bar", newIv));
      });
    });

    describe("#decryptUrl", () => {
      const crypto = createCrypto();
      const iv = crypto.generateSeed();
      test("decryption with equal iv and key works", () => {
        expect(crypto.decryptUrl(crypto.encryptUrl("foo bar", iv), iv)).toEqual(
          "foo bar",
        );
      });

      test("decryption with equal iv and different key does not work", () => {
        expect(
          crypto.decryptUrl(createCrypto().encryptUrl("foo bar", iv), iv),
        ).not.toEqual("foo bar");
      });

      test("decryption with unequal iv's and equal key does not work", () => {
        const newIv = crypto.generateSeed();
        // Ensure #generateSeed did not return equal content bytes
        expect(iv.toString(crypto.encoding)).not.toEqual(
          newIv.toString(crypto.encoding),
        );
        expect(
          crypto.decryptUrl(crypto.encryptUrl("foo bar", iv), newIv),
        ).not.toEqual("foo bar");
      });
    });
  });
});
