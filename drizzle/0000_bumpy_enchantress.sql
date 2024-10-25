CREATE TABLE `urls_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text(11) NOT NULL,
	`endpoint` text(2048) NOT NULL,
	`password` text(128),
	`expiration` integer,
	`visits` integer DEFAULT 0 NOT NULL,
	`once` integer DEFAULT false NOT NULL,
	`disabled` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `path_idx` ON `urls_table` (`path`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `urls_table` (`disabled`);