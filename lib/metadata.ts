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
  
  routing.locales.forEach((loc) => {
    const langCode = localeMap[loc] || loc;
    alternateLanguages[langCode] = `${baseUrl}/${loc}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
  });
  
  return alternateLanguages;
}

export function generateMetadataForPage(
  locale: string,
  title: string,
  description: string,
  path: string = '/'
): Metadata {
  const canonical = `${baseUrl}/${locale}${path === '/' ? '' : path}`;
  const logoUrl = `${baseUrl}/logo.jpg`;
  
  return {
    title,
    description,
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
  };
}

