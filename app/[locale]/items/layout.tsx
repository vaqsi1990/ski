import type { Metadata } from 'next';
import { generateMetadataForPage } from '@/lib/metadata';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params;
  
  const titles: Record<string, string> = {
    en: "Ski Equipment - Ski Rent Fanatic",
    geo: "თხილამურების აღჭურვილობა - Ski Rent Fanatic",
    ru: "Лыжное снаряжение - Ski Rent Fanatic"
  };
  
  const descriptions: Record<string, string> = {
    en: "Browse our complete selection of ski and snowboard equipment. Premium quality gear for all skill levels at competitive prices.",
    geo: "გადახედეთ ჩვენს სრულ არჩევანს თხილამურებისა და სნოუბორდების აღჭურვილობის. პრემიუმ ხარისხის აღჭურვილობა ყველა დონისთვის კონკურენტუნარიან ფასებზე.",
    ru: "Просмотрите наш полный выбор лыжного и сноубордического снаряжения. Премиум качественное оборудование для всех уровней по конкурентоспособным ценам."
  };

  return generateMetadataForPage(
    locale,
    titles[locale] || titles.en,
    descriptions[locale] || descriptions.en,
    '/items'
  );
}

export default function ItemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

