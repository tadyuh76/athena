-- Migration: Add review images and likes support
-- Date: 2025-01-05
-- Description: Adds support for image uploads in reviews and tracks individual users who liked reviews

-- Add images column to product_reviews table (stores array of image URLs)
ALTER TABLE product_reviews
ADD COLUMN IF NOT EXISTS images TEXT[];

-- Create review_likes table to track which users liked which reviews
CREATE TABLE IF NOT EXISTS review_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate likes
  CONSTRAINT unique_review_user_like UNIQUE (review_id, user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_review_likes_review ON review_likes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_user ON review_likes(user_id);

-- Add comment
COMMENT ON TABLE review_likes IS 'Tracks which users have liked which reviews (heart functionality)';
COMMENT ON COLUMN product_reviews.images IS 'Array of image URLs uploaded by the reviewer';
