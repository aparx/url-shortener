import {
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes,
} from "crypto";

export interface UrlCryptography {
  readonly encoding: BufferEncoding;

  encryptUrl(raw: string, seed: Buffer): string;
  decryptUrl(encrypted: string, seed: Buffer): string;
  hashPassword(password: string, salt: Buffer): string;
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

  encryptUrl(raw: string, iv: Buffer): string {
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(raw, "utf8", this.encoding);
    encrypted += cipher.final(this.encoding);
    return encrypted;
  }

  decryptUrl(encrypted: string, iv: Buffer): string {
    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encrypted, this.encoding, "utf8");
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
