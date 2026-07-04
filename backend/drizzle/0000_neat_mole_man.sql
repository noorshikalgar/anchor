CREATE TABLE "checkins" (
	"id" varchar(100) NOT NULL,
	"user_id" uuid NOT NULL,
	"habit_id" varchar(50) NOT NULL,
	"date" date NOT NULL,
	"status" varchar(20) NOT NULL,
	"reason" varchar(50),
	"note" text,
	"used_fallback" boolean DEFAULT false NOT NULL,
	"logged_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "checkins_id_user_id_pk" PRIMARY KEY("id","user_id")
);
--> statement-breakpoint
CREATE TABLE "day_logs" (
	"date" date NOT NULL,
	"user_id" uuid NOT NULL,
	"disrupted" boolean DEFAULT false NOT NULL,
	"disruption_note" text,
	CONSTRAINT "day_logs_date_user_id_pk" PRIMARY KEY("date","user_id")
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" varchar(50) NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"icon" varchar(50) NOT NULL,
	"default_version" text NOT NULL,
	"fallback_version" text NOT NULL,
	"slot" varchar(50) NOT NULL,
	"in_focus" smallint DEFAULT 0 NOT NULL,
	"focus_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "habits_id_user_id_pk" PRIMARY KEY("id","user_id")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"slots_unlocked" smallint DEFAULT 1 NOT NULL,
	"ai_enabled" boolean DEFAULT false NOT NULL,
	"api_provider" varchar(20),
	"api_key_encrypted" text,
	"week_starts_on" smallint DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_logs" ADD CONSTRAINT "day_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;