CREATE TABLE `admin_audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`shop_id` text NOT NULL,
	`action` text NOT NULL,
	`reason` text NOT NULL,
	`previous_status` text NOT NULL,
	`next_status` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `admin_audit_shop_created_idx` ON `admin_audit_logs` (`shop_id`,`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `auth_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`shop_id` text NOT NULL,
	`staff_public_id` text NOT NULL,
	`shop_name` text NOT NULL,
	`shop_address` text NOT NULL,
	`shop_phone` text NOT NULL,
	`staff_name` text NOT NULL,
	`staff_title` text NOT NULL,
	`contact_name` text NOT NULL,
	`contact_phone` text NOT NULL,
	`requested_at` integer NOT NULL,
	`note` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`request_key` text NOT NULL,
	`payload_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_customer_request_unique` ON `bookings` (`customer_id`,`request_key`);--> statement-breakpoint
CREATE INDEX `bookings_customer_created_idx` ON `bookings` (`customer_id`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `bookings_shop_created_idx` ON `bookings` (`shop_id`,`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `shops` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`address` text NOT NULL,
	`phone` text NOT NULL,
	`business_hours` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`status_reason` text DEFAULT '' NOT NULL,
	`moderation_version` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shops_owner_id_unique` ON `shops` (`owner_id`);--> statement-breakpoint
CREATE INDEX `shops_updated_idx` ON `shops` (`updated_at`,`id`);--> statement-breakpoint
CREATE INDEX `shops_status_updated_idx` ON `shops` (`status`,`updated_at`,`id`);--> statement-breakpoint
CREATE TABLE `staff` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`client_id` text NOT NULL,
	`name` text NOT NULL,
	`title` text NOT NULL,
	`skills` text NOT NULL,
	`description` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_shop_client_unique` ON `staff` (`shop_id`,`client_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`openid` text NOT NULL,
	`phone` text,
	`role` text DEFAULT 'customer' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_app_openid_unique` ON `users` (`app_id`,`openid`);