-- Create notification type enum
CREATE TYPE "NotificationType" AS ENUM ('NEW_OFFER', 'COUPON_EXPIRY', 'PROMO', 'SYSTEM');

-- Create notifications table
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "title_bn" TEXT,
    "body" TEXT NOT NULL,
    "body_bn" TEXT,
    "data" JSONB,
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");
CREATE INDEX "notifications_is_global_created_at_idx" ON "notifications"("is_global", "created_at");

-- Add foreign key constraint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
