import { urlsTable } from "@/db";
import { eq, getTableColumns, InferSelectModel, sql } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { DefaultUrlCrypto, UrlCryptography } from "./urlCryptography";
import { UrlSafetyService } from "./urlSafetyService";
import { ShortenUrlData } from "./urlSchema";

/**
 * The result of UrlCoreService#resolve, omitting secured columns, that should
 * only be accessible through the UrlCoreService and not by third parties.
 * This is due to security and consistency, since UrlCoreService owns and handles
 * those columns in specific ways, that an external function may not recognize.
 */
export type ShortenedUrl = Omit<
  InferSelectModel<typeof urlsTable>,
  "cryptoSeed" | "encryptedEndpoint" | "hashedPassword"
> & { hasPassword?: boolean };

export interface ShortenUrlResult {
  path: string;
  secure?: boolean | null;
}

export interface UrlCoreService {
  readonly database: LibSQLDatabase<any>;
  readonly crypto: UrlCryptography;

  /**
   * Shortens the endpoint contained in `data`, by inserting a new URL row into
   * the database and returning the unique path generated and if it's secure.
   * - If `password` is defined in `data`, it is hashed before insertion.
   * - The URL is encrypted before insertion into the database.
   *
   * @throws Error - if `data`'s expiration date is given and not the future
   * @param data the data to be inserted into the database
   */
  shortenUrl(data: ShortenUrlData): Promise<ShortenUrlResult>;

  matchesPassword(path: string, plainPassword: string): Promise<boolean>;

  resolve(path: string): Promise<ShortenedUrl | null>;
}

export class DefaultUrlCoreService implements UrlCoreService {
  readonly database: LibSQLDatabase<any>;
  readonly crypto: UrlCryptography;
  readonly verifier?: UrlSafetyService;

  constructor({
    database,
    verifier,
    crypto = new DefaultUrlCrypto(),
  }: {
    database: DefaultUrlCoreService["database"];
    crypto?: DefaultUrlCoreService["crypto"];
    verifier?: DefaultUrlCoreService["verifier"];
  }) {
    this.database = database;
    this.crypto = crypto;
    this.verifier = verifier;
  }

  async resolve(path: string): Promise<ShortenedUrl | null> {
    const {
      cryptoSeed,
      encryptedEndpoint,
      hashedPassword,
      ...selectTableColumns
    } = getTableColumns(urlsTable);
    const [result] = await this.database
      .select({
        ...selectTableColumns,
        hasPassword: sql<boolean>`${hashedPassword} is not null`,
      })
      .from(urlsTable)
      .where(eq(urlsTable.path, path))
      .limit(1);
    if (!result) return null;
    return result;
  }

  async matchesPassword(path: string, password: string): Promise<boolean> {
    if (password == null) throw new Error("Password may not be null");
    const [result] = await this.database
      .select({
        hash: urlsTable.hashedPassword,
        salt: urlsTable.cryptoSeed,
      })
      .from(urlsTable)
      .where(eq(urlsTable.path, path))
      .limit(1);
    if (!result || !result.salt) return false;
    const saltBuffer = Buffer.from(result.salt, this.crypto.encoding);
    return this.crypto.hashString(password, saltBuffer) === result.hash;
  }

  async shortenUrl(data: ShortenUrlData): Promise<ShortenUrlResult> {
    const { endpoint, password, expireIn, ...restData } = data;
    if (endpoint == null) throw new Error("Endpoint cannot be null");
    const seedBuffer = this.crypto.generateSeed();
    const encryptedEndpoint = this.crypto.encryptUrl(endpoint, seedBuffer);
    const hashedPassword =
      password && seedBuffer
        ? this.crypto.hashString(password, seedBuffer)
        : undefined;
    const expiration =
      expireIn && Math.floor(expireIn) > 0
        ? new Date(Math.round(Date.now() + expireIn * 1000 * 60))
        : undefined;
    const [result] = await this.database
      .insert(urlsTable)
      .values({
        encryptedEndpoint,
        hashedPassword,
        cryptoSeed: seedBuffer.toString(this.crypto.encoding),
        expiration,
        secure: this.verifier && (await this.verifier.isUrlSafe(data.endpoint)),
        ...restData,
      })
      .returning({
        path: urlsTable.path,
        secure: urlsTable.secure,
      });
    return result;
  }
}
