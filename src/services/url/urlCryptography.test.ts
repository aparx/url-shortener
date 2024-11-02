import { expect, test } from "@jest/globals";
import { randomBytes } from "crypto";
import { describe } from "node:test";
import { DefaultUrlCrypto } from "./urlCryptography";

describe("DefaultUrlCrypto", () => {
  test("expect error because of wrong key length", () => {
    expect(() => new DefaultUrlCrypto({ key: randomBytes(8) })).toThrow();
    expect(() => new DefaultUrlCrypto({ key: randomBytes(64) })).toThrow();
    expect(
      () => new DefaultUrlCrypto({ key: randomBytes(9).toString() }),
    ).toThrow();
    expect(
      () => new DefaultUrlCrypto({ key: randomBytes(64).toString() }),
    ).toThrow();
  });

  describe("with randomly generated key (check for determinism)", () => {
    function createCrypto() {
      return new DefaultUrlCrypto({ key: randomBytes(32) });
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
        expect(() =>
          crypto.decryptUrl(createCrypto().encryptUrl("foo bar", iv), iv),
        ).toThrow();
      });

      test("decryption with unequal iv's and equal key does not work", () => {
        const newIv = crypto.generateSeed();
        // Ensure #generateSeed did not return equal content bytes
        expect(iv.toString(crypto.encoding)).not.toEqual(
          newIv.toString(crypto.encoding),
        );
        expect(() =>
          crypto.decryptUrl(crypto.encryptUrl("foo bar", iv), newIv),
        ).toThrow();
      });
    });

    describe("#generateSeed", () => {
      const crypto = createCrypto();
      test("expect return not to equal another return", () => {
        expect(crypto.generateSeed().toString()).not.toEqual(
          crypto.generateSeed().toString(),
        );
      });

      test("expect byte length to be 16 bytes", () => {
        expect(crypto.generateSeed().length).toEqual(16);
      });
    });
  });
});
