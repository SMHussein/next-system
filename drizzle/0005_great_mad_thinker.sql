CREATE TABLE "cronLogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"info" text DEFAULT 'Cron log ran' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- DROP TABLE "neon_auth"."users_sync" CASCADE;