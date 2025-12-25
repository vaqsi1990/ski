import Hero from "@/components/Hero";
import Weather from "@/components/Weather";
import Equipment from "@/components/Equipment";
import Services from "@/components/Services";
import Footer from "@/components/Footer";
import Map from "@/components/Map";
import type { Metadata } from 'next';
import { generateMetadataForPage } from '@/lib/metadata';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params;
  
  const titles: Record<string, string> = {
    en: "Ski Rent Fanatic - Premium Ski & Snowboard Rental in Gudauri",
    ka: "Ski Rent Fanatic - პრემიუმ თხილამურების გაქირავება გუდაურში",
    ru: "Ski Rent Fanatic - Премиум прокат лыж и сноубордов в Гудаури"
  };
  
  const descriptions: Record<string, string> = {
    en: "Best ski and snowboard rental in Gudauri. Premium equipment, competitive prices. Book your ski gear online today!",
    ka: "საუკეთესო თხილამურებისა და სნოუბორდების გაქირავება გუდაურში. პრემიუმ აღჭურვილობა, კონკურენტუნარიანი ფასები. დაჯავშნეთ თქვენი სათხილამურო აღჭურვილობა ონლაინ დღესვე!",
    ru: "Лучший прокат лыж и сноубордов в Гудаури. Премиум оборудование, конкурентоспособные цены. Забронируйте свое лыжное снаряжение онлайн сегодня!"
  };

  return generateMetadataForPage(
    locale,
    titles[locale] || titles.en,
    descriptions[locale] || descriptions.en,
    '/'
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Weather />
      <Equipment />

      <Services />
    <Map />
     
    </>
  );
}
