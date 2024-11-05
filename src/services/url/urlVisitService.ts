import { urlsTable } from "@/db";
import { eq, sql } from "drizzle-orm";
import { UrlCoreService } from "./urlCoreService";

type VisitAttemptResultErrorCode =
  | "not-found"
  | "wrong-password"
  | "expired"
  | "endpoint"
  | "insecure";

type VisitAttemptResult =
  | { state: "error"; code: VisitAttemptResultErrorCode; endpoint?: never }
  | { state: "success"; code?: never; endpoint: string; secure: boolean };

export interface UrlVisitService {
  readonly core: UrlCoreService;

  /**
   * Attempts a visit of `path`, with `password`, if possible and returns a
   * result, further explaining the outcome of the visit.
   * - If the outcome is a success and the decrypted endpoint is returned,
   *   the visit counter has been increased and thus the visit was logged.
   * - The input password is hashed automatically, based on the salt provided
   *   for given `path`. Only if an URL is associated to `path`.
   * - This function does all the validation checks: such as checking against
   *   the password, possible expirations (one-time, date, ...), and more.
   *
   * @param path the target path to attempt to visit
   * @param plainPassword the (potential) password of `path` in plaintext
   * @returns the result of the attempted visit of `path`
   */
  attemptVisit(
    path: string,
    plainPassword?: string,
  ): Promise<VisitAttemptResult>;

  /**
   * Increments the visit counter for the URL with `path` and returns the
   * decrypted endpoint for `path`, or null if there is no URL associated with
   * `path`.
   * - If the decryption fails, the visit increment is undone (or rolled back).
   * - This function does *not* contain checks for password matching,
   *   maximum visits (e.g. one time use), expiration etc.
   *
   * @param path the target path to visit
   */
  logVisitAndDecryptEndpoint(path: string): Promise<string | null>;
}

export class DefaultUrlVisitService implements UrlVisitService {
  constructor(readonly core: UrlCoreService) {}

  async attemptVisit(
    path: string,
    password?: string,
  ): Promise<VisitAttemptResult> {
    function createError(code: VisitAttemptResultErrorCode) {
      return { state: "error", code } as const;
    }

    const shortenUrl = await this.core.resolve(path);
    if (!shortenUrl || shortenUrl.disabled) return createError("not-found");
    if (shortenUrl.once && shortenUrl.visits !== 0)
      return createError("expired");
    if (shortenUrl.expiration && Date.now() > shortenUrl.expiration.getTime())
      return createError("expired");
    if (shortenUrl.hasPassword && !password)
      return createError("wrong-password");
    if (password && !(await this.core.matchesPassword(path, password)))
      return createError("wrong-password");
    const endpoint = await this.logVisitAndDecryptEndpoint(path);
    if (!endpoint) return createError("endpoint");
    return { state: "success", endpoint, secure: !!shortenUrl.secure };
  }

  async logVisitAndDecryptEndpoint(path: string): Promise<string | null> {
    // Increment visits atomically; rollback by decrementing if decryption fails
    // This avoids transaction locks while ensuring data integrity in concurrent
    // accesses. This is mainly due to limits with SQLite.
    const [result] = await this.core.database
      .update(urlsTable)
      .set({ visits: sql`${urlsTable.visits} + 1` })
      .where(eq(urlsTable.path, path))
      .returning({
        cryptoSeed: urlsTable.cryptoSeed,
        encryptedEndpoint: urlsTable.encryptedEndpoint,
      });
    if (!result) return null;
    try {
      const seedBuf = Buffer.from(result.cryptoSeed, this.core.crypto.encoding);
      return this.core.crypto.decryptUrl(result.encryptedEndpoint, seedBuf);
    } catch (error) {
      // Rollback increment due to fail with decryption
      await this.core.database
        .update(urlsTable)
        .set({ visits: sql`${urlsTable.visits} - 1` })
        .where(eq(urlsTable.path, path));
      throw error; // Rethrow the error for handling upstream
    }
  }
}
