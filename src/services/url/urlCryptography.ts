import {
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes,
} from "crypto";

/**
 * Interface responsible for providing cryptography and security features for
 * shortened URLs, such as encrypting and decrypting endpoints, hashing
 * passwords and generating the crytographic seed.
 *
 * The interface also publicly exposes an `encoding` field, further describing
 * the buffer encoding used for "stringifying" the crypotgraphic seed and its
 * conversion back to a buffer.
 */
export interface UrlCryptography {
  readonly encoding: BufferEncoding;

  encryptUrl(plainUrl: string, seed: Buffer): string;

  decryptUrl(encryptedUrl: string, seed: Buffer): string;

  hashPassword(password: string, seed: Buffer): string;

  generateSeed(): Buffer;
}

export class DefaultUrlCrypto implements UrlCryptography {
  readonly key: Buffer;
  readonly encoding: BufferEncoding;
  readonly algorithm: string;

  constructor({
    key,
    encoding = "base64",
    algorithm = "aes-256-cbc",
  }: {
    key: string | Buffer;
    encoding?: BufferEncoding;
    algorithm?: string;
  }) {
    this.key = typeof key === "string" ? Buffer.from(key, encoding) : key;
    this.encoding = encoding;
    this.algorithm = algorithm;
  }

  encryptUrl(plainUrl: string, iv: Buffer): string {
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(plainUrl, "utf8", this.encoding);
    encrypted += cipher.final(this.encoding);
    return encrypted;
  }

  decryptUrl(encryptedUrl: string, iv: Buffer): string {
    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encryptedUrl, this.encoding, "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  hashPassword(clear: string, salt: Buffer): string {
    return pbkdf2Sync(clear, salt, 128, 32, "sha512").toString(this.encoding);
  }

  generateSeed(): Buffer {
    return randomBytes(16);
  }
}
