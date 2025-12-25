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
    en: "Book Ski Equipment - Ski Rent Fanatic",
    ka: "თხილამურების დაჯავშნა - Ski Rent Fanatic",
    ru: "Забронировать лыжное снаряжение - Ski Rent Fanatic"
  };
  
  const descriptions: Record<string, string> = {
    en: "Book your ski and snowboard equipment online. Choose from premium gear, select dates, and complete your reservation in minutes.",
    ka: "დაჯავშნეთ თქვენი თხილამურებისა და სნოუბორდების აღჭურვილობა ონლაინ. აირჩიეთ პრემიუმ აღჭურვილობა, აირჩიეთ თარიღები და დაასრულეთ დაჯავშნა წუთებში.",
    ru: "Забронируйте свое лыжное и сноубордическое снаряжение онлайн. Выберите из премиум оборудования, выберите даты и завершите бронирование за минуты."
  };

  return generateMetadataForPage(
    locale,
    titles[locale] || titles.en,
    descriptions[locale] || descriptions.en,
    '/booking'
  );
}

export default async function BookingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      <StructuredData locale={locale} type="booking" />
      {children}
    </>
  );
}

