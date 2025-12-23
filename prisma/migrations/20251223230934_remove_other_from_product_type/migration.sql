-- First, update any products with type 'OTHER' to 'ACCESSORY'
UPDATE "Product" SET "type" = 'ACCESSORY' WHERE "type" = 'OTHER';

-- Create a new enum without OTHER
CREATE TYPE "ProductType_new" AS ENUM ('SKI', 'SNOWBOARD', 'ADULT_CLOTH', 'CHILD_CLOTH', 'ADULT_SKI_SET', 'CHILD_SKI_SET', 'CHILD_SNOWBOARD_SET', 'ADULT_SNOWBOARD_SET', 'ACCESSORY');

-- Alter the Product table to use the new enum
ALTER TABLE "Product" ALTER COLUMN "type" TYPE "ProductType_new" USING ("type"::text::"ProductType_new");

-- Drop the old enum
DROP TYPE "ProductType";

-- Rename the new enum to ProductType
ALTER TYPE "ProductType_new" RENAME TO "ProductType";

