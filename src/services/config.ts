import { db } from "@/db";
import { DefaultUrlCoreService, DefaultUrlCrypto } from "./url";
import { DefaultUrlVisitService } from "./url/urlVisitService";

export const urlCrypto = new DefaultUrlCrypto({
  key: process.env.URL_ENCRYPTION_KEY!,
});
export const urlCoreService = new DefaultUrlCoreService(db(), urlCrypto);
export const urlVisitService = new DefaultUrlVisitService(urlCoreService);
