-- AddReviewModeration
-- Add moderation fields to reviews table and create moderation_history table

-- Rename columns to match new schema
ALTER TABLE "reviews" RENAME COLUMN "body" TO "comment";
ALTER TABLE "reviews" RENAME COLUMN "photos" TO "imageUrls";

-- Add moderation fields to reviews
ALTER TABLE "reviews" 
ADD COLUMN "riskScore" DOUBLE PRECISION,
ADD COLUMN "moderationFlags" TEXT[],
ADD COLUMN "moderatedAt" TIMESTAMP(3),
ADD COLUMN "moderatorId" TEXT,
ADD COLUMN "processingTimeHours" DOUBLE PRECISION;

-- Create indexes for moderation fields
CREATE INDEX "reviews_riskScore_idx" ON "reviews"("riskScore");
CREATE INDEX "reviews_moderatedAt_idx" ON "reviews"("moderatedAt");

-- Create moderation_history table
CREATE TABLE "moderation_history" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "moderatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_history_pkey" PRIMARY KEY ("id")
);

-- Create indexes for moderation_history
CREATE INDEX "moderation_history_reviewId_idx" ON "moderation_history"("reviewId");
CREATE INDEX "moderation_history_moderatorId_idx" ON "moderation_history"("moderatorId");
CREATE INDEX "moderation_history_createdAt_idx" ON "moderation_history"("createdAt");

-- Add foreign key constraint
ALTER TABLE "moderation_history" ADD CONSTRAINT "moderation_history_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;