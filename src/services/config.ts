import { db } from "@/db";
import { DefaultUrlCoreService, DefaultUrlCrypto } from "./url";
import { GoogleUrlSafetyService } from "./url/urlSafetyService";
import { DefaultUrlVisitService } from "./url/urlVisitService";

export const urlCrypto = new DefaultUrlCrypto({
  key: process.env.URL_ENCRYPTION_KEY!,
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
