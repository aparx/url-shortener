import { createCipheriv, createDecipheriv } from "crypto";

/** Interface responsible for encrypting and decrypting Endpoint-URLs. */
export interface UrlCrypto {
  encrypt(raw: string, seed: Buffer): string;
  decrypt(encrypted: string, seed: Buffer): string;
}

/** `UrlCrypto` implementation, that uses AES to encrypt and decrypt URLs. */
export class AESUrlCrypto implements UrlCrypto {
  constructor(
    readonly key: Buffer,
    readonly encoding: BufferEncoding = "base64",
    readonly algorithm: string = "aes-256-cbc",
  ) {
    if (key == null) throw new Error("AES key must not be nullable");
  }

  encrypt(raw: string, iv: Buffer): string {
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(raw, "utf8", this.encoding);
    encrypted += cipher.final(this.encoding);
    return encrypted;
  }

  decrypt(encrypted: string, iv: Buffer): string {
    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encrypted, this.encoding, "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
}