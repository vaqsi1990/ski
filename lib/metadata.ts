import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://skirentfanatic.ge';

// Map locale codes to proper language codes for hreflang
const localeMap: Record<string, string> = {
  'en': 'en',
  'geo': 'ka',
  'ru': 'ru'
};

export function generateHreflangTags(
  locale: string,
  path: string = '/'
): Record<string, string> {
  const pathWithoutLocale = path.startsWith('/') ? path : `/${path}`;
  
  const alternateLanguages: Record<string, string> = {
    'x-default': `${baseUrl}/en${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`
  };
  
  // Generate hreflang tags for all locales using proper ISO 639-1 language codes
  routing.locales.forEach((loc) => {
    // Use proper language code (ka for geo, not geo)
    const langCode = localeMap[loc] || loc;
    // URL still uses the locale code (geo, en, ru) but hreflang uses language code (ka, en, ru)
    alternateLanguages[langCode] = `${baseUrl}/${loc}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
  });
  
  return alternateLanguages;
}

export function generateMetadataForPage(
  locale: string,
  title: string,
  description: string,
  path: string = '/',
  keywords?: string[]
): Metadata {
  const canonical = `${baseUrl}/${locale}${path === '/' ? '' : path}`;
  const logoUrl = `${baseUrl}/logo.jpg`;
  
  // Default keywords based on locale
  const defaultKeywords: Record<string, string[]> = {
    en: [
      'ski rental',
      'snowboard rental',
      'Gudauri',
      'ski equipment',
      'winter sports',
      'Georgia',
      'ski resort',
      'snowboard equipment',
      'ski gear rental',
    ],
    geo: [
      'თხილამურების გაქირავება',
      'სნოუბორდების გაქირავება',
      'გუდაური',
      'თხილამურების აღჭურვილობა',
      'ზამთრის სპორტი',
      'საქართველო',
      'სათხილამურო კურორტი',
    ],
    ru: [
      'прокат лыж',
      'прокат сноубордов',
      'Гудаури',
      'лыжное снаряжение',
      'зимний спорт',
      'Грузия',
      'лыжный курорт',
      'сноубордическое снаряжение',
    ],
  };
  
  const pageKeywords = keywords || defaultKeywords[locale] || defaultKeywords.en;
  
  return {
    title,
    description,
    keywords: pageKeywords.join(', '),
    alternates: {
      languages: generateHreflangTags(locale, path),
      canonical,
    },
    openGraph: {
      title,
      description,
      locale: locale === 'geo' ? 'ka_GE' : locale === 'en' ? 'en_US' : 'ru_RU',
      alternateLocale: routing.locales
        .filter(l => l !== locale)
        .map(l => l === 'geo' ? 'ka_GE' : l === 'en' ? 'en_US' : 'ru_RU'),
      url: canonical,
      images: [
        {
          url: logoUrl,
          width: 1200,
          height: 630,
          alt: 'Ski Rent Fanatic Logo',
        },
      ],
      type: 'website',
      siteName: 'Ski Rent Fanatic',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [logoUrl],
    },
    icons: {
      icon: logoUrl,
      apple: logoUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      // Add verification codes if available
      // google: 'your-google-verification-code',
      // yandex: 'your-yandex-verification-code',
    },
  };
}

