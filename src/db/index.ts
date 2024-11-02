import { memoize } from "@/utils/memoize";
import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql/web";
import * as schema from "./schema";
export * from "./schema";

export type Database = ReturnType<typeof db>;

export const db = memoize(() => {
  if (process.env.NODE_ENV === "test")
    throw new Error("Production database only available in dev or prod");
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  return drizzle<typeof schema>({ client });
});
