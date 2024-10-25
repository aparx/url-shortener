import cuid2 from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const sqlNow = sql`current_timestamp`;
const createCuid2 = cuid2.init({ length: 11 });

const column = {
  timestamp: (name: string) => integer(name, { mode: "timestamp" }),
  boolean: (name: string) => integer(name, { mode: "boolean" }),
  text: (name: string, length?: number) => text(name, { length }),
  int: (name: string) => integer(name),
  serialId: () => column.int("id").primaryKey({ autoIncrement: true }),
  createdAt: () => column.timestamp("created_at").notNull().default(sqlNow),
  updatedAt: () => column.timestamp("updated_at").$onUpdate(() => new Date()),
} as const;

export const urlsTable = sqliteTable(
  "urls_table",
  {
    id: column.serialId(),
    path: column.text("path", 11).notNull().$defaultFn(createCuid2),
    endpoint: column.text("endpoint", 2048).notNull(),
    hashedPassword: column.text("hashed_password", 128),
    passwordSalt: column.text("password_salt", 512),
    expiration: column.timestamp("expiration"),
    visits: column.int("visits").notNull().default(0),
    once: column.boolean("once").notNull().default(false),
    disabled: column.boolean("disabled").notNull().default(false),
    createdAt: column.createdAt(),
    updatedAt: column.updatedAt(),
  },
  (table) => ({
    path: uniqueIndex("path_idx").on(table.path),
    active: index("active_idx").on(table.disabled),
  }),
);
