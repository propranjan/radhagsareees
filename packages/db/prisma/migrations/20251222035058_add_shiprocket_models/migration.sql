-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('PENDING', 'CREATED', 'PICKUP_SCHEDULED', 'PICKED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RTO_INITIATED', 'RTO_IN_TRANSIT', 'RTO_DELIVERED', 'CANCELLED', 'FAILED');

-- AlterTable
ALTER TABLE "inventory_locations" ADD COLUMN     "warehouseId" TEXT;

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "shiprocketPickupId" INTEGER,
    "pickupLocationCode" TEXT,
    "address" TEXT NOT NULL,
    "address2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "pincode" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "contactPerson" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfillments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "shiprocketOrderId" INTEGER,
    "shipmentId" INTEGER,
    "awbCode" TEXT,
    "courierName" TEXT,
    "courierId" INTEGER,
    "labelUrl" TEXT,
    "manifestUrl" TEXT,
    "invoiceUrl" TEXT,
    "trackingUrl" TEXT,
    "status" "FulfillmentStatus" NOT NULL DEFAULT 'PENDING',
    "shiprocketStatus" TEXT,
    "statusUpdatedAt" TIMESTAMP(3),
    "estimatedDelivery" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "rtoInitiatedAt" TIMESTAMP(3),
    "rtoDeliveredAt" TIMESTAMP(3),
    "weight" DECIMAL(6,2),
    "length" DECIMAL(6,2),
    "breadth" DECIMAL(6,2),
    "height" DECIMAL(6,2),
    "lastError" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fulfillments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_tracking" (
    "id" TEXT NOT NULL,
    "fulfillmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "statusMessage" TEXT NOT NULL,
    "location" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_name_key" ON "warehouses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE INDEX "warehouses_pincode_idx" ON "warehouses"("pincode");

-- CreateIndex
CREATE INDEX "warehouses_isActive_idx" ON "warehouses"("isActive");

-- CreateIndex
CREATE INDEX "fulfillments_orderId_idx" ON "fulfillments"("orderId");

-- CreateIndex
CREATE INDEX "fulfillments_awbCode_idx" ON "fulfillments"("awbCode");

-- CreateIndex
CREATE INDEX "fulfillments_status_idx" ON "fulfillments"("status");

-- CreateIndex
CREATE INDEX "fulfillments_shiprocketOrderId_idx" ON "fulfillments"("shiprocketOrderId");

-- CreateIndex
CREATE INDEX "shipment_tracking_fulfillmentId_idx" ON "shipment_tracking"("fulfillmentId");

-- CreateIndex
CREATE INDEX "shipment_tracking_timestamp_idx" ON "shipment_tracking"("timestamp");

-- CreateIndex
CREATE INDEX "inventory_locations_warehouseId_idx" ON "inventory_locations"("warehouseId");

-- AddForeignKey
ALTER TABLE "inventory_locations" ADD CONSTRAINT "inventory_locations_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillments" ADD CONSTRAINT "fulfillments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillments" ADD CONSTRAINT "fulfillments_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_tracking" ADD CONSTRAINT "shipment_tracking_fulfillmentId_fkey" FOREIGN KEY ("fulfillmentId") REFERENCES "fulfillments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
