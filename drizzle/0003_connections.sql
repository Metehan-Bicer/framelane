CREATE TABLE `connections` (
	`id` text PRIMARY KEY NOT NULL,
	`issuer_id` text NOT NULL,
	`key_id` text NOT NULL,
	`encrypted_key` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
