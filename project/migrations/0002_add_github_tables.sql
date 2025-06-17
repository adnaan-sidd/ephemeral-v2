ALTER TABLE "users" ADD COLUMN "company" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");