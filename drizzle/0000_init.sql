CREATE TABLE `apps` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`bundle_id` text NOT NULL,
	`primary_locale` text NOT NULL,
	`locales` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `apps_bundle_id_unique` ON `apps` (`bundle_id`);