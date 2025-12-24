-- CreateTable
CREATE TABLE "LessonPricing" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numberOfPeople" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "LessonPricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonPricing_numberOfPeople_duration_key" ON "LessonPricing"("numberOfPeople", "duration");

