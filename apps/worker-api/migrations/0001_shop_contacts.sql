ALTER TABLE `bookings` ADD `shop_wechat` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `shop_qq` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `shops` ADD `wechat` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `shops` ADD `qq` text DEFAULT '' NOT NULL;