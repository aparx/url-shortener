import { db, urlsTable } from "@/db";
import { pbkdf2Sync, randomBytes } from "crypto";
import { eq, sql } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import "server-only";
import { AESUrlCrypto, UrlCrypto } from "./urlCrypto";
import { UrlLookupService } from "./urlLookupService";
import { UrlMutationService } from "./urlMutationService";
import { CreateRedirectData } from "./urlSchema";

export class UrlService implements UrlLookupService, UrlMutationService {
  readonly database: LibSQLDatabase;
  readonly generateSeed: () => Buffer;
  readonly hashPassword: (string: string, salt: Buffer) => string;
  readonly urlCrypto: UrlCrypto;
  readonly encoding: BufferEncoding;

  constructor(args: {
    database: UrlService["database"];
    generateSeed?: UrlService["generateSeed"];
    hashPassword?: UrlService["hashPassword"];
    urlCrypto?: UrlService["urlCrypto"];
    encoding?: UrlService["encoding"];
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
      Buffer.from(subject.cryptoSeed, this.encoding),
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
    if (!result || !result.salt) return false;
    const saltBuffer = Buffer.from(result.salt, this.encoding);
    return this.hashPassword(password, saltBuffer) === result.hash;
  }

  async createUrl(data: CreateRedirectData): Promise<string> {
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

  async visit(path: string): Promise<boolean> {
    const result = await this.database
      .update(urlsTable)
      .set({ visits: sql`${urlsTable.visits} + 1` })
      .where(eq(urlsTable.path, path));
    return result.rowsAffected !== 0;
  }
}

export const DefaultUrlService = new UrlService({
  database: db,
});
