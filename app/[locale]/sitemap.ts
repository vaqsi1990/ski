import { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://skirentfanatic.ge';

export default async function sitemap({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<MetadataRoute.Sitemap> {
  const { locale } = await params;
  
  const pages = [
    '',
    '/items',
    '/booking',
    '/about',
    '/lessons',
  ];

  return pages.map((page) => ({
    url: `${baseUrl}/${locale}${page}`,
    lastModified: new Date(),
    changeFrequency: page === '' ? 'daily' : 'weekly' as const,
    priority: page === '' ? 1.0 : 0.8,
  }));
}

// Generate sitemaps for all locales
export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

