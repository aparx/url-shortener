/** The lookup service for URLs, providing read and aggregation processes. */
export interface UrlLookupService {
  resolveEndpoint(path: string): Promise<string | null>;

  isPasswordMatching(path: string, password: string): Promise<boolean>;
}
