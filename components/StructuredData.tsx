import { routing } from '@/i18n/routing';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://skirentfanatic.ge';

// Locale codes are now already using proper ISO codes (ka, en, ru)

interface StructuredDataProps {
  locale: string;
  type?: 'home' | 'booking' | 'items' | 'about' | 'lessons';
}

function getPageName(loc: string, pageType: string): string {
  const names: Record<string, Record<string, string>> = {
    booking: {
      en: 'Booking',
      ka: 'დაჯავშნა',
      ru: 'Бронирование',
    },
    items: {
      en: 'Equipment',
      ka: 'აღჭურვილობა',
      ru: 'Оборудование',
    },
    about: {
      en: 'About Us',
      ka: 'ჩვენს შესახებ',
      ru: 'О нас',
    },
    lessons: {
      en: 'Lessons',
      ka: 'გაკვეთილები',
      ru: 'Уроки',
    },
  };
  return names[pageType]?.[loc] || pageType;
}

export default function StructuredData({ locale, type = 'home' }: StructuredDataProps) {
  const currentUrl = `${baseUrl}/${locale}${type === 'home' ? '' : `/${type}`}`;
  
  // Organization Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ski Rent Fanatic',
    url: baseUrl,
    logo: `${baseUrl}/logo.jpg`,
    description: locale === 'ka' 
      ? 'საუკეთესო თხილამურებისა და სნოუბორდების გაქირავება გუდაურში'
      : locale === 'ru'
      ? 'Лучший прокат лыж и сноубордов в Гудаури'
      : 'Best ski and snowboard rental in Gudauri',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'GE',
      addressLocality: 'Gudauri',
      addressRegion: 'Mtskheta-Mtianeti',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['Georgian', 'English', 'Russian'],
    },
    sameAs: [
      // Add social media links if available
    ],
  };

  // LocalBusiness Schema
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    '@id': `${baseUrl}/#business`,
    name: 'Ski Rent Fanatic',
    image: `${baseUrl}/logo.jpg`,
    url: baseUrl,
    telephone: '', // Add phone number if available
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Gudauri',
      addressLocality: 'Gudauri',
      addressRegion: 'Mtskheta-Mtianeti',
      postalCode: '',
      addressCountry: 'GE',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 42.4779,
      longitude: 44.4796,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    servesCuisine: false,
    areaServed: {
      '@type': 'City',
      name: 'Gudauri',
    },
  };

  // Service Schema
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Ski and Snowboard Rental',
    provider: {
      '@type': 'LocalBusiness',
      name: 'Ski Rent Fanatic',
    },
    areaServed: {
      '@type': 'City',
      name: 'Gudauri',
    },
    description: locale === 'ka'
      ? 'თხილამურებისა და სნოუბორდების გაქირავება გუდაურში'
      : locale === 'ru'
      ? 'Прокат лыж и сноубордов в Гудаури'
      : 'Ski and snowboard rental in Gudauri',
  };

  // Website Schema
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Ski Rent Fanatic',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/items?type={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: routing.locales, // Locales are already using proper ISO codes (ka, en, ru)
  };

  // Breadcrumb Schema
  const breadcrumbSchema = type !== 'home' ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: locale === 'ka' ? 'მთავარი' : locale === 'ru' ? 'Главная' : 'Home',
        item: `${baseUrl}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: getPageName(locale, type),
        item: currentUrl,
      },
    ],
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
    </>
  );
}

