ALTER TABLE `urls_table` RENAME COLUMN "endpoint" TO "encrypted_endpoint";--> statement-breakpoint
ALTER TABLE `urls_table` RENAME COLUMN "password" TO "hashed_password";--> statement-breakpoint
DROP INDEX IF EXISTS "path_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "active_idx";--> statement-breakpoint
ALTER TABLE `urls_table` ALTER COLUMN "path" TO "path" text(32) NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `path_idx` ON `urls_table` (`path`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `urls_table` (`disabled`);--> statement-breakpoint
ALTER TABLE `urls_table` ADD `seed` text(512) NOT NULL;