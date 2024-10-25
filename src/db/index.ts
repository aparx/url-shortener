import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql/web";
import "server-only";
export * from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const db = drizzle({ client });
