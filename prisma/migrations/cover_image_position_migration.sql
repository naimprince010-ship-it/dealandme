-- Add cover_image_position column to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS cover_image_position VARCHAR(50) DEFAULT 'center';
