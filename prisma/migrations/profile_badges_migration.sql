-- Migration: Add name/email to users + Badge system
-- Run this SQL in your Supabase SQL Editor

-- 1. Add name and email columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- 2. Create BadgeCriteriaType enum
DO $$ BEGIN
    CREATE TYPE "BadgeCriteriaType" AS ENUM ('COUPONS_USED', 'COUPONS_GENERATED', 'RESTAURANTS_VISITED', 'REFERRALS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create badges table
CREATE TABLE IF NOT EXISTS "badges" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_bn" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL,
    "criteria_type" "BadgeCriteriaType" NOT NULL,
    "threshold" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- 4. Create user_badges table
CREATE TABLE IF NOT EXISTS "user_badges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- 5. Create unique constraint on badges.key
DO $$ BEGIN
    ALTER TABLE "badges" ADD CONSTRAINT "badges_key_key" UNIQUE ("key");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 6. Create unique constraint on user_badges (user_id, badge_id)
DO $$ BEGIN
    ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_badge_id_key" UNIQUE ("user_id", "badge_id");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 7. Create foreign key constraints
DO $$ BEGIN
    ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" 
        FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 8. Create indexes
CREATE INDEX IF NOT EXISTS "badges_is_active_sort_order_idx" ON "badges"("is_active", "sort_order");
CREATE INDEX IF NOT EXISTS "user_badges_user_id_idx" ON "user_badges"("user_id");
