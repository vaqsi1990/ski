import prisma from '../lib/prisma'
import { ProductType } from '../app/generated/prisma/enums'

async function main() {
  // Update all products with type "OTHER" to "ADULT_CLOTH"
  const products = await prisma.product.findMany({
    where: { type: ProductType.OTHER },
  })
  
  console.log(`Found ${products.length} products with type OTHER`)
  
  if (products.length > 0) {
    const result = await prisma.product.updateMany({
      where: { type: ProductType.OTHER },
      data: { type: ProductType.ADULT_CLOTH },
    })
    
    console.log(`Updated ${result.count} products from OTHER to ADULT_CLOTH`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

