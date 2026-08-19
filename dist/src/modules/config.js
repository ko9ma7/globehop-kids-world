export const APP = {
  name: 'GlobeHop',
  defaultLocale: 'ko',
  supportedLocales: ['ko', 'en', 'zh', 'hi', 'es', 'ar', 'bn', 'pt', 'ru', 'ja', 'de', 'fr', 'id', 'ur', 'tr', 'vi', 'it', 'th', 'fa', 'fil'],
  defaultOriginId: 'seoul',
  geocodingEndpoint: 'https://geocoding-api.open-meteo.com/v1/search',
  forecastEndpoint: 'https://api.open-meteo.com/v1/forecast',
  airQualityEndpoint: 'https://air-quality-api.open-meteo.com/v1/air-quality',
  worldBankEndpoint: 'https://api.worldbank.org/v2',
  osrmEndpoint: 'https://router.project-osrm.org',
  worldBankIndicators: {
    population: 'SP.POP.TOTL',
    gdp: 'NY.GDP.MKTP.CD',
    gni: 'NY.GNP.MKTP.CD'
  },
  maxRecent: 8
};

export const REGION_FILES = {
  Africa: 'africa',
  Americas: 'americas',
  Asia: 'asia',
  Europe: 'europe',
  Oceania: 'oceania',
  Polar: 'polar',
  Other: 'other'
};
