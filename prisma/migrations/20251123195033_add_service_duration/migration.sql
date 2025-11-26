-- DropIndex
DROP INDEX "Service_name_key";

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "durationMinutes" INTEGER NOT NULL DEFAULT 30;
