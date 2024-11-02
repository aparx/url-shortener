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

  /** Generates a random buffer used for salt and IV */
  generateSeed(): Buffer;
}

export class DefaultUrlCrypto implements UrlCryptography {
  /** This value is defined by the AES CBC block size of 16 bytes */
  public static readonly SEED_LENGTH = 16;

  readonly key: Buffer;
  readonly encoding: BufferEncoding;
  readonly algorithm: string;

  private readonly hash: (clear: string, salt: Buffer) => Buffer;

  constructor({
    encoding = "base64",
    keySize = 32,
    key = randomBytes(keySize),
    hash = (clear, salt) => pbkdf2Sync(clear, salt, 10000, keySize, "sha512"),
  }: {
    encoding?: BufferEncoding;
    /** Size of `key` in bytes (used for hashing and encryption) */
    keySize?: 8 | 16 | 32;
    key?: string | Buffer;
    hash?: DefaultUrlCrypto["hash"];
  } = {}) {
    this.key = typeof key === "string" ? Buffer.from(key, encoding) : key;
    if (this.key.length !== keySize /* BYTE_LENGTH */)
      throw new Error(`Key must be ${keySize} bytes`);
    this.encoding = encoding;
    this.algorithm = `aes-${8 * keySize}-cbc`;
    this.hash = hash;
  }

  encryptUrl(plainUrl: string, iv: Buffer): string {
    if (iv.length !== DefaultUrlCrypto.SEED_LENGTH)
      throw new Error(`Vector must be ${DefaultUrlCrypto.SEED_LENGTH} bytes`);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(plainUrl, "utf8", this.encoding);
    encrypted += cipher.final(this.encoding);
    return encrypted;
  }

  decryptUrl(encryptedUrl: string, iv: Buffer): string {
    if (iv.length !== DefaultUrlCrypto.SEED_LENGTH)
      throw new Error(`Vector must be ${DefaultUrlCrypto.SEED_LENGTH} bytes`);
    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encryptedUrl, this.encoding, "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  hashPassword(clear: string, salt: Buffer): string {
    const minSaltLength = DefaultUrlCrypto.SEED_LENGTH;
    if (salt.length < minSaltLength)
      throw new Error(`Salt must be at least ${minSaltLength} bytes long`);
    return this.hash(clear, salt).toString(this.encoding);
  }

  /**
   * Generates a random buffer of `SEED_LENGTH` bytes to be used as either
   * an IV for encryption/decryption or a salt for hashing passwords.
   */
  generateSeed(): Buffer {
    return randomBytes(DefaultUrlCrypto.SEED_LENGTH);
  }
}
