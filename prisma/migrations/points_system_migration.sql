-- Add points field to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "points" INTEGER NOT NULL DEFAULT 0;

-- Create points_source enum type
DO $$ BEGIN
    CREATE TYPE "PointsSource" AS ENUM ('REFERRAL', 'ADMIN_ADJUST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create points_transactions table
CREATE TABLE IF NOT EXISTS "points_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" "PointsSource" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_transactions_pkey" PRIMARY KEY ("id")
);

-- Create index on user_id and created_at
CREATE INDEX IF NOT EXISTS "points_transactions_user_id_created_at_idx" ON "points_transactions"("user_id", "created_at");

-- Add foreign key constraint
DO $$ BEGIN
    ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
