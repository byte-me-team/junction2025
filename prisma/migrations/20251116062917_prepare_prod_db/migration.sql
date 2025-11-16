/*
  Warnings:

  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MatchedSuggestion` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ActivitySource" AS ENUM ('suggestion', 'real_event', 'relative', 'calendar');

-- DropForeignKey
ALTER TABLE "MatchedSuggestion" DROP CONSTRAINT "MatchedSuggestion_eventId_fkey";

-- DropForeignKey
ALTER TABLE "MatchedSuggestion" DROP CONSTRAINT "MatchedSuggestion_userId_fkey";

-- DropTable
DROP TABLE "Event";

-- DropTable
DROP TABLE "MatchedSuggestion";

-- CreateTable
CREATE TABLE "ActivityHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "partnerName" TEXT,
    "source" "ActivitySource" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "partnerName" TEXT,
    "dueDate" TIMESTAMP(3),
    "source" "ActivitySource" DEFAULT 'calendar',
    "sourceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityHistory_userId_createdAt_idx" ON "ActivityHistory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CalendarActivity_userId_dueDate_idx" ON "CalendarActivity"("userId", "dueDate");

-- AddForeignKey
ALTER TABLE "ActivityHistory" ADD CONSTRAINT "ActivityHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarActivity" ADD CONSTRAINT "CalendarActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
