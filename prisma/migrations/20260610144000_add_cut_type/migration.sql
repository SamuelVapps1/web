-- CreateEnum
CREATE TYPE "CutType" AS ENUM ('SHORT', 'STANDARD', 'NO_CUT', 'ADVICE');

-- AlterTable
ALTER TABLE "Reservation"
ADD COLUMN "cutType" "CutType" NOT NULL DEFAULT 'ADVICE';
