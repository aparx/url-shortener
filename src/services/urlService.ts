import { db, urlsTable } from "@/db";
import { pbkdf2Sync, randomBytes } from "crypto";
import { eq } from "drizzle-orm";
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

type HashPasswordFn = (password: string) => [hash: string, salt: string];

export interface UrlService {
  resolveEndpoint(path: string): Promise<string | null>;

  /**
   * Inserts `data` into the database and returns the `path` generated.
   * This process basically "shortens" the URL contained in `data`.
   * If `password` is defined in `data`, it is hashed before insertion.
   *
   * @throws Error - if `data`'s expiration date is given and not the future
   * @param data the data to be inserted into the database
   */
  createUrl(data: CreateRedirectData): Promise<string>;
}

export class UrlServiceImpl implements UrlService {
  readonly database: LibSQLDatabase;
  readonly hash: (password: string) => [hash: string, salt: string];

  constructor(args: {
    database: UrlServiceImpl["database"];
    hashPassword?: UrlServiceImpl["hash"];
  }) {
    this.database = args.database;
    this.hash =
      args.hashPassword ??
      ((password: string): [hash: string, salt: string] => {
        const salt = randomBytes(16).toString("base64");
        return [pbkdf2Sync(password, salt, 128, 32, "sha512").toString(), salt];
      });
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

  async createUrl(data: CreateRedirectData): Promise<string> {
    const { password, ...restData } = data;
    const [hashedPassword, passwordSalt] = password ? this.hash(password) : [];
    if (restData.expiration && restData.expiration.getTime() <= Date.now())
      throw new Error("Expiration date must be in the future");
    const [result] = await this.database
      .insert(urlsTable)
      .values({ hashedPassword, passwordSalt, ...restData })
      .returning({ path: urlsTable.path });
    return result.path;
  }
}

export const UrlService = new UrlServiceImpl({
  database: db,
});
