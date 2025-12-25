// Re-export types and constants for convenience
export { routing } from './routing'

// Export locales array from routing
export const locales = ['ka', 'en', 'ru'] as const
export type Locale = (typeof locales)[number]
