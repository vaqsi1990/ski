import type { Metadata } from 'next';
import { generateMetadataForPage } from '@/lib/metadata';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params;
  
  const titles: Record<string, string> = {
    en: "About Us - Ski Rent Fanatic",
    geo: "ჩვენს შესახებ - Ski Rent Fanatic",
    ru: "О нас - Ski Rent Fanatic"
  };
  
  const descriptions: Record<string, string> = {
    en: "Learn about Ski Rent Fanatic - your trusted partner for premium ski and snowboard rental in Gudauri. Quality equipment and excellent service.",
    geo: "გაიგეთ Ski Rent Fanatic-ის შესახებ - თქვენი საიმედო პარტნიორი პრემიუმ თხილამურებისა და სნოუბორდების გაქირავებისთვის გუდაურში. ხარისხიანი აღჭურვილობა და შესანიშნავი სერვისი.",
    ru: "Узнайте о Ski Rent Fanatic - вашем надежном партнере по прокату премиум лыж и сноубордов в Гудаури. Качественное оборудование и отличный сервис."
  };

  return generateMetadataForPage(
    locale,
    titles[locale] || titles.en,
    descriptions[locale] || descriptions.en,
    '/about'
  );
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

