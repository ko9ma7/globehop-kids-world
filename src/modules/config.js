export const APP = {
  name: 'GlobeHop',
  defaultLocale: 'ko',
  supportedLocales: ['ko', 'en', 'ja', 'zh'],
  defaultOrigin: {
    name: 'Seoul',
    nameKo: '서울',
    lat: 37.5665,
    lon: 126.978,
    countryCode: 'KR',
    timezone: 'Asia/Seoul',
    source: 'sample'
  },
  geocodingEndpoint: 'https://geocoding-api.open-meteo.com/v1/search',
  worldBankEndpoint: 'https://api.worldbank.org/v2',
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
