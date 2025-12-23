import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['geo', 'en', 'ru'],
  defaultLocale: 'en'
});
