-- CreateEnum
CREATE TYPE "LessonLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'EXPERT');

-- CreateEnum
CREATE TYPE "LessonLanguage" AS ENUM ('GEORGIAN', 'ENGLISH', 'RUSSIAN');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "Lesson" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numberOfPeople" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "level" "LessonLevel" NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "language" "LessonLanguage" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "personalId" TEXT NOT NULL,
    "status" "LessonStatus" NOT NULL DEFAULT 'PENDING',
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

