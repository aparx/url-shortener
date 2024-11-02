import { urlsTable } from "@/db";
import { eq, sql } from "drizzle-orm";
import { UrlCoreService } from "./urlCoreService";

type VisitAttemptResultErrorCode =
  | "not-found"
  | "wrong-password"
  | "expired"
  | "endpoint";

type VisitAttemptResult =
  | { state: "error"; code: VisitAttemptResultErrorCode; endpoint?: never }
  | { state: "success"; code?: never; endpoint: string };

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
   * - This function may be a single atomic operation: If the endpoint
   *   decryption fails, the counter increment is rolled back.
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
    const shortenUrl = await this.core.resolve(path);
    if (!shortenUrl || shortenUrl.disabled)
      return { state: "error", code: "not-found" };
    if (shortenUrl.once && shortenUrl.visits !== 0)
      return { state: "error", code: "expired" };
    if (shortenUrl.expiration && Date.now() > shortenUrl.expiration.getTime())
      return { state: "error", code: "expired" };
    if (shortenUrl.hasPassword && !password)
      return { state: "error", code: "wrong-password" };
    if (password && !(await this.core.matchesPassword(path, password)))
      return { state: "error", code: "wrong-password" };
    const endpoint = await this.logVisitAndDecryptEndpoint(path);
    if (!endpoint) return { state: "error", code: "endpoint" };
    return { state: "success", endpoint };
  }

  logVisitAndDecryptEndpoint(path: string): Promise<string | null> {
    // We use a transaction to rollback the visit counter if an error occurs
    // with decrypting the endpoint, or anything related to that.
    return this.core.database.transaction(async (tx) => {
      const [result] = await tx
        .update(urlsTable)
        .set({ visits: sql`${urlsTable.visits} + 1` })
        .where(eq(urlsTable.path, path))
        .returning({
          cryptoSeed: urlsTable.cryptoSeed,
          encryptedEndpoint: urlsTable.encryptedEndpoint,
        });
      if (!result) return null;
      const seedBuffer = Buffer.from(
        result.cryptoSeed,
        this.core.crypto.encoding,
      );
      return this.core.crypto.decryptUrl(result.encryptedEndpoint, seedBuffer);
    });
  }
}
