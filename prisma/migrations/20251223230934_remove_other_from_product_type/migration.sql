-- Create a new enum with all the values we need (including ACCESSORY, without OTHER)
CREATE TYPE "ProductType_new" AS ENUM ('SKI', 'SNOWBOARD', 'ADULT_CLOTH', 'CHILD_CLOTH', 'ADULT_SKI_SET', 'CHILD_SKI_SET', 'CHILD_SNOWBOARD_SET', 'ADULT_SNOWBOARD_SET', 'ACCESSORY');

-- Alter the Product table to use the new enum, converting 'OTHER' to 'ACCESSORY' during the conversion
ALTER TABLE "Product" ALTER COLUMN "type" TYPE "ProductType_new" USING (
  CASE 
    WHEN "type"::text = 'OTHER' THEN 'ACCESSORY'::"ProductType_new"
    ELSE "type"::text::"ProductType_new"
  END
);

-- Drop the old enum
DROP TYPE "ProductType";

-- Rename the new enum to ProductType
ALTER TYPE "ProductType_new" RENAME TO "ProductType";

