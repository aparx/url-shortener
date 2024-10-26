import { CreateRedirectData } from "./urlSchema";

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
