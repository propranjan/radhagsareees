-- CreateIndex
-- Add overlayPng field to Variant model for virtual try-on functionality

-- AlterTable
ALTER TABLE "variants" ADD COLUMN "overlayPng" TEXT;