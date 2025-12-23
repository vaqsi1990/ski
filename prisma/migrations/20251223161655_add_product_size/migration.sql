-- CreateEnum
CREATE TYPE "ProductSize" AS ENUM ('S', 'M', 'L');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "size" "ProductSize";
