import { db, urlsTable } from "@/db";
import {
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes,
} from "crypto";
import { eq, sql } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import "server-only";
import { z } from "zod";

type CreateRedirectData = z.infer<typeof createRedirectDataSchema>;

export const createRedirectDataSchema = z.object({
  endpoint: z.string().url().max(2048),
  password: z.string().max(128).nullish().optional(),
  once: z.boolean().optional(),
  /** Expire in `x` minutes */
  expireIn: z.number().int().nullish().optional(),
});

/** The lookup service for URLs, providing read and aggregation processes. */
export interface UrlLookupService {
  resolveEndpoint(path: string): Promise<string | null>;

  isPasswordMatching(path: string, password: string): Promise<boolean>;
}

/** The mutation service for URLs, providing write processes. */
export interface UrlMutationService {
  /**
   * This process basically "shortens" the URL contained in `data`.
   * If `password` is defined in `data`, it is hashed before insertion.
   *
   * @throws Error - if `data`'s expiration date is given and not the future
   * @param data the data to be inserted into the database
   */
  createUrl(data: CreateRedirectData): Promise<string>;

  /**
   * Increments the visit counter for the URL with `path` and returns true, if
   * the counter could be updated.
   *
   * @param path the target path to visit
   */
  visit(path: string): Promise<boolean>;
}

interface UrlCrypto {
  encrypt(raw: string, vector: string): string;
  decrypt(encrypted: string, vector: string): string;
}

class AESUrlCrypto implements UrlCrypto {
  constructor(
    readonly key: Buffer<ArrayBuffer>,
    readonly algorithm: string = "aes-256-cbc",
  ) {
    if (key == null) throw new Error("AES key must not be nullable");
  }

  encrypt(raw: string, iv: string): string {
    const ivBuffer = Buffer.from(iv, "base64");
    const cipher = createCipheriv(this.algorithm, this.key, ivBuffer);
    let encrypted = cipher.update(raw, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  }
  decrypt(encrypted: string, iv: string): string {
    const ivBuffer = Buffer.from(iv, "base64");
    const decipher = createDecipheriv(this.algorithm, this.key, ivBuffer);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
}

export class UrlServiceImpl implements UrlLookupService, UrlMutationService {
  readonly database: LibSQLDatabase;
  readonly generateSeed: () => string;
  readonly hashPassword: (string: string, salt: string) => string;
  readonly urlCrypto: AESUrlCrypto;

  constructor(args: {
    database: UrlServiceImpl["database"];
    generateSeed?: UrlServiceImpl["generateSeed"];
    hashPassword?: UrlServiceImpl["hashPassword"];
    urlCrypto?: UrlServiceImpl["urlCrypto"];
  }) {
    this.database = args.database;
    this.generateSeed =
      args.generateSeed ?? (() => randomBytes(16).toString("base64"));
    this.hashPassword =
      args.hashPassword ??
      ((password: string, salt: string) =>
        pbkdf2Sync(password, salt, 128, 32, "sha512").toString());
    this.urlCrypto =
      args.urlCrypto ??
      new AESUrlCrypto(Buffer.from(process.env.URL_ENCRYPTION_KEY!, "base64"));
  }

  async resolveEndpoint(path: string): Promise<string | null> {
    const [subject] = await this.database
      .select({
        encryptedEndpoint: urlsTable.encryptedEndpoint,
        cryptoSeed: urlsTable.cryptoSeed,
      })
      .from(urlsTable)
      .where(eq(urlsTable.path, path))
      .limit(1);
    if (!subject) return null;
    return this.urlCrypto.decrypt(
      subject.encryptedEndpoint,
      subject.cryptoSeed,
    );
  }

  async isPasswordMatching(path: string, password: string): Promise<boolean> {
    const [result] = await this.database
      .select({
        hash: urlsTable.hashedPassword,
        salt: urlsTable.cryptoSeed,
      })
      .from(urlsTable)
      .where(eq(urlsTable.path, path))
      .limit(1);
    if (result && result.salt)
      return this.hashPassword(password, result.salt) === result.hash;
    return false;
  }

  async createUrl(data: CreateRedirectData): Promise<string> {
    const { endpoint, password, expireIn, ...restData } = data;
    const cryptoSeed = this.generateSeed();
    const encryptedEndpoint = this.urlCrypto.encrypt(endpoint, cryptoSeed);
    const hashedPassword =
      password && cryptoSeed
        ? this.hashPassword(password, cryptoSeed)
        : undefined;
    const expiration =
      expireIn && Math.floor(expireIn) > 0
        ? new Date(Math.round(Date.now() + expireIn * 1000 * 60 * 60))
        : undefined;
    const [result] = await this.database
      .insert(urlsTable)
      .values({
        encryptedEndpoint,
        hashedPassword,
        cryptoSeed,
        expiration,
        ...restData,
      })
      .returning({ path: urlsTable.path });
    return result.path;
  }

  async visit(path: string): Promise<boolean> {
    const result = await this.database
      .update(urlsTable)
      .set({ visits: sql`${urlsTable.visits} + 1` })
      .where(eq(urlsTable.path, path));
    return result.rowsAffected !== 0;
  }
}

export const UrlService = new UrlServiceImpl({
  database: db,
});
