export const APP = {
  name: 'GlobeHop',
  defaultLocale: 'ko',
  supportedLocales: ['ko', 'en', 'ja', 'zh', 'hi', 'de', 'fr', 'es', 'pt', 'ar', 'id'],
  defaultOriginId: 'seoul',
  geocodingEndpoint: 'https://geocoding-api.open-meteo.com/v1/search',
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
