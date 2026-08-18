# GlobeHop Data Guide

The project intentionally separates data from UI code. Large datasets can be expanded without turning `app.js` into a data file.

## 1. Data layout

```text
src/data/
├─ countries/
│  ├─ index.json                 # small global search index
│  └─ regions/
│     ├─ africa.json
│     ├─ americas.json
│     ├─ asia.json
│     ├─ europe.json
│     ├─ oceania.json
│     ├─ other.json
│     └─ polar.json
├─ knowledge/
│  ├─ index.json                 # codes that have curated knowledge packs
│  ├─ kr.json
│  ├─ jp.json
│  └─ ...
├─ places/
│  └─ index.json                 # featured offline-search places
└─ world-geometries.json         # simplified country geometry for the globe
```

## 2. Country core schema

Each regional file contains objects shaped like:

```json
{
  "code2": "KR",
  "code3": "KOR",
  "name": "South Korea",
  "nativeName": "대한민국",
  "capital": "Seoul",
  "capitalLat": 37.56826,
  "capitalLon": 126.97783,
  "lat": 37,
  "lon": 127.5,
  "region": "Asia",
  "subregion": "Eastern Asia",
  "population": 51446201,
  "areaKm2": 100210,
  "currencies": ["KRW"],
  "languages": ["ko"],
  "timezones": ["UTC+09:00"],
  "borders": ["PRK"],
  "callingCodes": ["82"],
  "tld": [".kr"]
}
```

`countries/index.json` should remain small. It only needs enough fields to find a country and know which region file to lazy-load.

## 3. Add a country knowledge pack

Create `src/data/knowledge/xx.json` where `xx` is the lowercase ISO alpha-2 code.

```json
{
  "code2": "XX",
  "specialties": ["English item 1", "English item 2"],
  "animals": ["Animal 1", "Animal 2"],
  "plants": ["Plant 1", "Plant 2"],
  "facts": ["Short fact 1", "Short fact 2", "Short fact 3"],
  "ko": {
    "specialties": ["한국어 항목 1", "한국어 항목 2"],
    "animals": ["동물 1", "동물 2"],
    "plants": ["식물 1", "식물 2"],
    "facts": ["짧은 지식 1", "짧은 지식 2", "짧은 지식 3"]
  }
}
```

Then add the uppercase code to `src/data/knowledge/index.json`. The current UI falls back to English for Japanese/Chinese knowledge copy when a translated pack is not present. A future version can extend each pack with `ja` and `zh` using the same shape.

## 4. Add an offline place

Append an entry to `src/data/places/index.json`:

```json
{
  "id": "unique-slug",
  "name": "English display name",
  "nameKo": "한국어 이름",
  "type": "city",
  "countryCode": "KR",
  "lat": 35.1796,
  "lon": 129.0756,
  "timezone": "Asia/Seoul"
}
```

Supported starter `type` values are `city`, `landmark`, and `region`.

## 5. Add more languages

1. Add the locale code to `supportedLocales` in `src/modules/config.js`.
2. Add UI strings in `src/modules/i18n.js`.
3. Add a human-readable language label in `localeLabel()`.
4. Country names will automatically use `Intl.DisplayNames` where the browser supports the locale.
5. Add locale branches to knowledge JSON files when you want fully translated educational content.

## 6. Split data further as it grows

Recommended thresholds:

- Keep `countries/index.json` under roughly 100 KB.
- If `places/index.json` exceeds several thousand items, split it by continent or first letter and add a tiny place search index.
- Keep one knowledge JSON file per country. This avoids downloading hundreds of cultural facts for a child who opened only one destination.
- Large image/audio packs should live under `public/content/<country-code>/` and be lazy-loaded.

## 7. Volatile statistics

Do not manually hardcode GDP/GNI every year. `src/modules/dataService.js` already queries these World Bank indicator codes when online:

- `SP.POP.TOTL` — population
- `NY.GDP.MKTP.CD` — GDP (current US$)
- `NY.GNP.MKTP.CD` — GNI/GNP-style current US$ series

If the API is unavailable, GlobeHop keeps working with the bundled country snapshot.
