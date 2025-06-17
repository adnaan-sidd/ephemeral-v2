CREATE TABLE "github_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"github_id" varchar(255) NOT NULL,
	"username" varchar(255) NOT NULL,
	"full_name" varchar(255),
	"avatar_url" varchar(500),
	"bio" text,
	"location" varchar(255),
	"company" varchar(255),
	"blog" varchar(500),
	"twitter_username" varchar(255),
	"access_token" varchar(500) NOT NULL,
	"refresh_token" varchar(500),
	"token_expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "github_profiles_github_id_unique" UNIQUE("github_id")
);
--> statement-breakpoint
CREATE TABLE "user_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_user_id" varchar(255) NOT NULL,
	"access_token" varchar(500) NOT NULL,
	"refresh_token" varchar(500),
	"token_expires_at" timestamp,
	"scopes" jsonb,
	"provider_username" varchar(255),
	"provider_email" varchar(255),
	"connected_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "github_profiles" ADD CONSTRAINT "github_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_integrations" ADD CONSTRAINT "user_integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "company";