CREATE TABLE `listings` (
	`app_id` text NOT NULL,
	`locale` text NOT NULL,
	`fields` text DEFAULT '{}' NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`app_id`, `locale`),
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
