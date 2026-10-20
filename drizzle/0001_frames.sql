CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`mime` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `frames` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`position` integer NOT NULL,
	`captions` text DEFAULT '{}' NOT NULL,
	`shots` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `frames_app_position` ON `frames` (`app_id`,`position`);--> statement-breakpoint
ALTER TABLE `apps` ADD `design` text;