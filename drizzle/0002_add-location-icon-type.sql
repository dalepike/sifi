CREATE TYPE "public"."location_type" AS ENUM('home', 'office', 'vehicle', 'storage', 'other');--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "icon" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "location_type" "location_type";
