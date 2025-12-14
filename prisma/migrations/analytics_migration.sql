-- Analytics Migration
-- This migration adds fields and tables for tracking user activity and app installs

-- Add last_active_at column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP;

-- Add index on last_active_at for users
CREATE INDEX IF NOT EXISTS users_last_active_at_idx ON users(last_active_at);

-- Add last_active_at column to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP;

-- Add index on last_active_at for restaurants
CREATE INDEX IF NOT EXISTS restaurants_last_active_at_idx ON restaurants(last_active_at);

-- Create app_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE app_type AS ENUM ('CUSTOMER', 'RESTAURANT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create app_installs table
CREATE TABLE IF NOT EXISTS app_installs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    install_id VARCHAR(255) UNIQUE NOT NULL,
    app_type app_type NOT NULL,
    user_id VARCHAR(255),
    user_agent TEXT,
    last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add indexes on app_installs
CREATE INDEX IF NOT EXISTS app_installs_app_type_idx ON app_installs(app_type);
CREATE INDEX IF NOT EXISTS app_installs_last_seen_at_idx ON app_installs(last_seen_at);
