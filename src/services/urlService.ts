import { db, urlsTable } from "@/db";
import { pbkdf2Sync, randomBytes } from "crypto";
import { eq, sql } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import "server-only";
import { z } from "zod";

type CreateRedirectData = z.infer<typeof createRedirectDataSchema>;

export const createRedirectDataSchema = z.object({
  endpoint: z.string().max(2048),
  password: z.string().max(128).optional(),
  once: z.boolean().optional(),
  expiration: z.date().nullable().optional(),
});

/** The lookup service for URLs, providing read and aggregation processes. */
export interface UrlLookupService {
  resolveEndpoint(path: string): Promise<string | null>;

  isPasswordMatching(path: string, password: string): Promise<boolean>;
}

/** The mutation service for URLs, providing write processes. */
export interface UrlMutationService {
  /**
   * Inserts `data` into the database and returns the `path` generated.
   * This process basically "shortens" the URL contained in `data`.
   * If `password` is defined in `data`, it is hashed before insertion.
   *
   * @throws Error - if `data`'s expiration date is given and not the future
   * @param data the data to be inserted into the database
   */
  createUrl(data: CreateRedirectData): Promise<string>;

  visit(path: string): Promise<number | undefined>;
}

export class UrlServiceImpl implements UrlLookupService, UrlMutationService {
  readonly database: LibSQLDatabase;
  readonly hashPassword: (password: string, salt: string) => string;
  readonly generateSalt: () => string;

  constructor(args: {
    database: UrlServiceImpl["database"];
    hashPassword?: UrlServiceImpl["hashPassword"];
    generateSalt?: UrlServiceImpl["generateSalt"];
  }) {
    this.database = args.database;
    this.hashPassword =
      args.hashPassword ??
      ((password: string, salt: string) =>
        pbkdf2Sync(password, salt, 128, 32, "sha512").toString());
    this.generateSalt =
      args.generateSalt ?? (() => randomBytes(16).toString("base64"));
  }

  async resolveEndpoint(path: string): Promise<string | null> {
    const subject = await this.database
      .select({ endpoint: urlsTable.endpoint })
      .from(urlsTable)
      .where(eq(urlsTable.path, path))
      .limit(1);
    if (!subject?.length) return null;
    return subject[0].endpoint;
  }

  async isPasswordMatching(path: string, password: string): Promise<boolean> {
    const [result] = await this.database
      .select({ hash: urlsTable.hashedPassword, salt: urlsTable.passwordSalt })
      .from(urlsTable)
      .where(eq(urlsTable.path, path))
      .limit(1);
    if (result && result.salt)
      return this.hashPassword(password, result.salt) === result.hash;
    return false;
  }

  async createUrl(data: CreateRedirectData): Promise<string> {
    const { password, ...restData } = data;
    const passwordSalt = password ? this.generateSalt() : undefined;
    const hashedPassword =
      password && passwordSalt
        ? this.hashPassword(password, passwordSalt)
        : undefined;
    if (restData.expiration && restData.expiration.getTime() <= Date.now())
      throw new Error("Expiration date must be in the future");
    const [result] = await this.database
      .insert(urlsTable)
      .values({ hashedPassword, passwordSalt, ...restData })
      .returning({ path: urlsTable.path });
    return result.path;
  }

  async visit(path: string): Promise<number | undefined> {
    const [result] = await this.database
      .update(urlsTable)
      .set({ visits: sql`${urlsTable.visits} + 1` })
      .where(eq(urlsTable.path, path))
      .returning({ visits: urlsTable.visits });
    if (result) console.debug("UrlService#visit", path, result.visits);
    return result?.visits;
  }
}

export const UrlService = new UrlServiceImpl({
  database: db,
});
