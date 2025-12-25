import type { Metadata } from 'next';
import { generateMetadataForPage } from '@/lib/metadata';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params;
  
  const titles: Record<string, string> = {
    en: "Ski Lessons - Ski Rent Fanatic",
    geo: "თხილამურების გაკვეთილები - Ski Rent Fanatic",
    ru: "Уроки катания на лыжах - Ski Rent Fanatic"
  };
  
  const descriptions: Record<string, string> = {
    en: "Book professional ski and snowboard lessons in Gudauri. Experienced instructors for all skill levels. Improve your technique and confidence on the slopes.",
    geo: "დაჯავშნეთ პროფესიონალური თხილამურებისა და სნოუბორდების გაკვეთილები გუდაურში. გამოცდილი ინსტრუქტორები ყველა დონისთვის. გააუმჯობესეთ თქვენი ტექნიკა და თავდაჯერებულობა ფერდობებზე.",
    ru: "Забронируйте профессиональные уроки катания на лыжах и сноуборде в Гудаури. Опытные инструкторы для всех уровней. Улучшите свою технику и уверенность на склонах."
  };

  return generateMetadataForPage(
    locale,
    titles[locale] || titles.en,
    descriptions[locale] || descriptions.en,
    '/lessons'
  );
}

export default function LessonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

