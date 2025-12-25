import { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://skirentfanatic.ge';

export default function robots(): MetadataRoute.Robots {
  // Generate sitemap URLs for all locales
  const sitemaps = routing.locales.map(
    locale => `${baseUrl}/${locale}/sitemap.xml`
  );

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/static/',
        ],
      },
    ],
    sitemap: sitemaps,
  };
}

