CREATE TABLE `package_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contact` varchar(320) NOT NULL,
	`interests` text NOT NULL,
	`character` varchar(255),
	`timing` varchar(255),
	`budget` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `package_applications_id` PRIMARY KEY(`id`)
);
