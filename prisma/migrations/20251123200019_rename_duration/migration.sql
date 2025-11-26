/*
  Warnings:

  - You are about to drop the column `durationMinutes` on the `Service` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Service` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Service" DROP COLUMN "durationMinutes",
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 30;

-- CreateIndex
CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");
