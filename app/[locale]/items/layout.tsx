import type { Metadata } from 'next';
import { generateMetadataForPage } from '@/lib/metadata';
import StructuredData from '@/components/StructuredData';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params;
  
  const titles: Record<string, string> = {
    en: "Ski Equipment - Ski Rent Fanatic",
    ka: "თხილამურების აღჭურვილობა - Ski Rent Fanatic",
    ru: "Лыжное снаряжение - Ski Rent Fanatic"
  };
  
  const descriptions: Record<string, string> = {
    en: "Browse our complete selection of ski and snowboard equipment. Premium quality gear for all skill levels at competitive prices.",
    ka: "გადახედეთ ჩვენს სრულ არჩევანს თხილამურებისა და სნოუბორდების აღჭურვილობის. პრემიუმ ხარისხის აღჭურვილობა ყველა დონისთვის კონკურენტუნარიან ფასებზე.",
    ru: "Просмотрите наш полный выбор лыжного и сноубордического снаряжения. Премиум качественное оборудование для всех уровней по конкурентоспособным ценам."
  };

  return generateMetadataForPage(
    locale,
    titles[locale] || titles.en,
    descriptions[locale] || descriptions.en,
    '/items'
  );
}

export default async function ItemsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      <StructuredData locale={locale} type="items" />
      {children}
    </>
  );
}

