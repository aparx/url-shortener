import { db, urlsTable } from "@/db";
import { pbkdf2Sync, randomBytes } from "crypto";
import { eq, sql } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import "server-only";
import { AESUrlCrypto, UrlCrypto } from "./urlCrypto";
import { ShortenUrlData } from "./urlSchema";

/** The lookup service for URLs, providing read and aggregation processes. */
export interface UrlService {
  isPasswordMatching(path: string, password: string): Promise<boolean>;

  /**
   * Shortens the endpoint contained in `data`, by inserting a new URL row into
   * the database and returning the unique path generated.
   * - If `password` is defined in `data`, it is hashed before insertion.
   * - The URL is encrypted before insertion into the database.
   *
   * @throws Error - if `data`'s expiration date is given and not the future
   * @param data the data to be inserted into the database
   */
  shortenUrl(data: ShortenUrlData): Promise<string>;

  /**
   * Increments the visit counter for the URL with `path` and returns the
   * decrypted endpoint for `path`, or null if there is no URL associated with
   * `path`.
   * - This function may be a single atomic operation, if the endpoint
   *   decryption fails, the counter increment is rolled back.
   *
   * @param path the target path to visit
   */
  visit(path: string): Promise<string | null>;
}

export class DefaultUrlService implements UrlService {
  private static _default: DefaultUrlService | undefined;

  readonly database: LibSQLDatabase;
  readonly generateSeed: () => Buffer;
  readonly hashPassword: (string: string, salt: Buffer) => string;
  readonly urlCrypto: UrlCrypto;
  readonly encoding: BufferEncoding;

  constructor(args: {
    database: DefaultUrlService["database"];
    generateSeed?: DefaultUrlService["generateSeed"];
    hashPassword?: DefaultUrlService["hashPassword"];
    urlCrypto?: DefaultUrlService["urlCrypto"];
    encoding?: DefaultUrlService["encoding"];
  }) {
    this.database = args.database;
    this.encoding = args.encoding ?? "base64";
    this.generateSeed = args.generateSeed ?? (() => randomBytes(16));
    this.hashPassword =
      args.hashPassword ??
      ((password: string, salt: Buffer) =>
        pbkdf2Sync(password, salt, 128, 32, "sha512").toString());
    this.urlCrypto =
      args.urlCrypto ??
      new AESUrlCrypto(
        Buffer.from(process.env.URL_ENCRYPTION_KEY!, this.encoding),
      );
  }

  static default(): DefaultUrlService {
    if (DefaultUrlService._default != null) return DefaultUrlService._default;
    DefaultUrlService._default = new DefaultUrlService({ database: db });
    return DefaultUrlService._default;
  }

  async visit(path: string): Promise<string | null> {
    // We use a transaction to rollback the visit counter if an error occurs
    // with decrypting the endpoint, or anything related to that.
    return this.database.transaction(async (tx) => {
      const [result] = await tx
        .update(urlsTable)
        .set({ visits: sql`${urlsTable.visits} + 1` })
        .where(eq(urlsTable.path, path))
        .returning({
          cryptoSeed: urlsTable.cryptoSeed,
          encryptedEndpoint: urlsTable.encryptedEndpoint,
        });
      if (!result) return null;
      const seedBuffer = Buffer.from(result.cryptoSeed, this.encoding);
      return this.urlCrypto.decrypt(result.encryptedEndpoint, seedBuffer);
    });
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
    if (!result || !result.salt) return false;
    const saltBuffer = Buffer.from(result.salt, this.encoding);
    return this.hashPassword(password, saltBuffer) === result.hash;
  }

  async shortenUrl(data: ShortenUrlData): Promise<string> {
    const { endpoint, password, expireIn, ...restData } = data;
    const seedBuffer = this.generateSeed();
    const encryptedEndpoint = this.urlCrypto.encrypt(endpoint, seedBuffer);
    const hashedPassword =
      password && seedBuffer
        ? this.hashPassword(password, seedBuffer)
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
        cryptoSeed: seedBuffer.toString(this.encoding),
        expiration,
        ...restData,
      })
      .returning({ path: urlsTable.path });
    return result.path;
  }
}

export const defaultUrlService = new DefaultUrlService({
  database: db,
});
