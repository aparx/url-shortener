import { safebrowsing } from "@googleapis/safebrowsing";

export interface UrlSafetyService {
  isUrlSafe(endpoint: string): Promise<boolean>;
}

export class GoogleUrlSafetyService implements UrlSafetyService {
  constructor(
    readonly config: {
      apiKey: string;
      clientId: string;
      clientVersion: string;
    },
  ) {}

  async isUrlSafe(url: string): Promise<boolean> {
    const client = safebrowsing("v4");
    const result = await client.threatMatches.find({
      key: this.config.apiKey,
      requestBody: {
        client: {
          clientId: this.config.clientId,
          clientVersion: this.config.clientVersion,
        },
        threatInfo: {
          platformTypes: ["ANY_PLATFORM"],
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      },
    });
    // TODO test via http://testsafebrowsing.appspot.com/s/malware.html
    return !result.data.matches?.length;
  }
}
