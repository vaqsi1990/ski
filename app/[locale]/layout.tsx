import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from "next-intl/server";
import { notFound } from 'next/navigation'
import {routing} from '@/i18n/routing';
import Header from '@/components/Header'
import { Geist, Geist_Mono } from "next/font/google"
import "../globals.css"
import type { Metadata } from 'next'
import { generateMetadataForPage } from '@/lib/metadata'
import Footer from '@/components/Footer';
import StructuredData from '@/components/StructuredData';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// SEO metadata translations
const metadataTranslations: Record<string, Record<string, { title: string; description: string }>> = {
  en: {
    default: {
      title: "Ski Rent Fanatic - Premium Ski & Snowboard Rental in Gudauri",
      description: "Best ski and snowboard rental in Gudauri. Premium equipment, competitive prices. Book your ski gear online today!"
    }
  },
  geo: {
    default: {
      title: "Ski Rent Fanatic - პრემიუმ თხილამურების გაქირავება გუდაურში",
      description: "საუკეთესო თხილამურებისა და სნოუბორდების გაქირავება გუდაურში. პრემიუმ აღჭურვილობა, კონკურენტუნარიანი ფასები. დაჯავშნეთ თქვენი სათხილამურო აღჭურვილობა ონლაინ დღესვე!"
    }
  },
  ru: {
    default: {
      title: "Ski Rent Fanatic - Премиум прокат лыж и сноубордов в Гудаури",
      description: "Лучший прокат лыж и сноубордов в Гудаури. Премиум оборудование, конкурентоспособные цены. Забронируйте свое лыжное снаряжение онлайн сегодня!"
    }
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  
  if (!routing.locales.includes(locale as any)) {
    return {};
  }

  const translations = metadataTranslations[locale]?.default || metadataTranslations.en.default;
  
  // Default metadata for home page - individual pages will override
  const metadata = generateMetadataForPage(locale, translations.title, translations.description, '/');
  
  // Add icons metadata
  return {
    ...metadata,
    icons: {
      icon: [
        { url: '/logo.jpg', type: 'image/jpeg' },
        { url: '/logo.jpg', sizes: '16x16', type: 'image/jpeg' },
        { url: '/logo.jpg', sizes: '32x32', type: 'image/jpeg' },
        { url: '/logo.jpg', sizes: '48x48', type: 'image/jpeg' },
      ],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;  params: Promise<{locale: string}>;

}) {

  const {locale} = await params;

  // Validate that the locale is supported
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages()

  // Map locale to proper HTML lang attribute (ISO 639-1 language codes)
  const htmlLangMap: Record<string, string> = {
    'en': 'en',
    'geo': 'ka', // Georgian language code
    'ru': 'ru'
  };
  const htmlLang = htmlLangMap[locale] || locale;

  return (
    <html lang={htmlLang}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <StructuredData locale={locale} type="home" />
        <NextIntlClientProvider messages={messages}>
          <Header />
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
