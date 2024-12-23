import { db } from "@/database/database";
import { DefaultUrlCoreService } from "./urlCoreService";
import { DefaultUrlCrypto } from "./urlCryptography";
import { GoogleUrlSafetyService } from "./urlSafetyService";
import { DefaultUrlVisitService } from "./urlVisitService";

if (!process.env.URL_ENCRYPTION_KEY)
  throw new Error("Missing in .env: URL_ENCRYPTION_KEY");

export const urlCrypto = new DefaultUrlCrypto({
  key: process.env.URL_ENCRYPTION_KEY,
});

export const urlSafetyService = process.env.GOOGLE_SAFETY_API_KEY
  ? new GoogleUrlSafetyService({
      apiKey: process.env.GOOGLE_SAFETY_API_KEY!,
      clientId: process.env.GOOGLE_SAFETY_CLIENT_ID!,
      clientVersion: process.env.GOOGLE_SAFETY_CLIENT_VERSION!,
    })
  : undefined;

export const urlCoreService = new DefaultUrlCoreService({
  database: db(),
  crypto: urlCrypto,
  verifier: urlSafetyService,
});

export const urlVisitService = new DefaultUrlVisitService(urlCoreService);
