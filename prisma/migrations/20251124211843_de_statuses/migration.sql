-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('BESTAETIGT', 'STORNIERT', 'BLOCKIERT');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'BESTAETIGT';

-- CreateTable
CREATE TABLE "StoreConfig" (
    "id" SERIAL NOT NULL,
    "adminPassword" TEXT,

    CONSTRAINT "StoreConfig_pkey" PRIMARY KEY ("id")
);
