CREATE TYPE "public"."module_key" AS ENUM('pos', 'inventory', 'sales', 'accounting', 'procurement', 'customers', 'hr', 'attendance', 'payroll');--> statement-breakpoint
CREATE TABLE "business_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"module_key" "module_key" NOT NULL,
	"activated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_modules_business_module_unique" UNIQUE("business_id","module_key")
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "currency" text DEFAULT 'KES' NOT NULL;--> statement-breakpoint
ALTER TABLE "business_modules" ADD CONSTRAINT "business_modules_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;