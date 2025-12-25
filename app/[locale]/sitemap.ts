import { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://skirentfanatic.ge';

const pages = ['', '/items', '/booking', '/about', '/lessons'];

export default async function sitemap(
  props: {
    params: Promise<{ locale: string }>;
  } = {} as any
): Promise<MetadataRoute.Sitemap> {
  // Handle case where params might not be provided
  if (!props || !props.params) {
    // Generate sitemap for all locales as fallback
    const allSitemaps: MetadataRoute.Sitemap = [];
    for (const locale of routing.locales) {
      for (const page of pages) {
        allSitemaps.push({
          url: `${baseUrl}/${locale}${page}`,
          lastModified: new Date(),
          changeFrequency: page === '' ? 'daily' : 'weekly' as const,
          priority: page === '' ? 1.0 : 0.8,
        });
      }
    }
    return allSitemaps;
  }
  
  const resolvedParams = await props.params;
  const locale = resolvedParams?.locale;
  
  // Validate locale
  if (!locale || !routing.locales.includes(locale as any)) {
    return [];
  }
  
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

