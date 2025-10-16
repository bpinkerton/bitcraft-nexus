CREATE TABLE "link_codes" (
	"discord_id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "link_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "linked_users" (
	"user_id" bigint PRIMARY KEY NOT NULL,
	"discord_id" text NOT NULL,
	"linked_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "linked_users_discord_id_unique" UNIQUE("discord_id")
);
