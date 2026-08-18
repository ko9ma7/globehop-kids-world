# GlobeHop Data Guide

GlobeHop은 방대한 데이터를 한 파일에 몰아넣지 않고, 검색용 index와 상세 데이터를 분리합니다.

## 데이터 구조

```text
src/data/
├─ countries/
│  ├─ index.json
│  └─ regions/
│     ├─ africa.json
│     ├─ americas.json
│     ├─ asia.json
│     ├─ europe.json
│     ├─ oceania.json
│     ├─ other.json
│     └─ polar.json
├─ knowledge/
│  ├─ index.json
│  ├─ kr.json
│  ├─ jp.json
│  ├─ in.json
│  └─ ...
├─ origins/
│  └─ index.json
├─ places/
│  └─ index.json
└─ world-geometries.json
```

## 1. 국가 기본 데이터

지역 JSON 객체 예시:

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

`countries/index.json`에는 검색과 지역 shard 선택에 필요한 가벼운 필드만 유지하는 것이 좋습니다.

## 2. 아이용 국가 학습 데이터

파일명:

```text
src/data/knowledge/kr.json
src/data/knowledge/jp.json
src/data/knowledge/fr.json
```

권장 schema:

```json
{
  "code2": "XX",
  "overview": "Short child-friendly overview",
  "greeting": "Hello: ...",
  "climate": "...",
  "bestSeason": "...",
  "travelTips": "...",
  "specialties": ["..."],
  "animals": ["..."],
  "plants": ["..."],
  "landmarks": ["..."],
  "facts": ["...", "..."],
  "gallery": [
    {
      "title": "Landmark",
      "caption": "Short caption",
      "src": "https://...",
      "alt": "Accessible image description"
    }
  ],
  "ko": {
    "overview": "한국어 소개",
    "greeting": "인사말",
    "climate": "기후",
    "bestSeason": "추천 시기",
    "travelTips": "여행 팁",
    "specialties": ["..."],
    "animals": ["..."],
    "plants": ["..."],
    "landmarks": ["..."],
    "facts": ["..."]
  }
}
```

새 파일을 만들고 `knowledge/index.json`에 대문자 ISO 2자리 코드를 추가하세요.

현재 프로젝트에는 20개 이상의 국가에 확장 지식팩이 포함되어 있습니다. 지식팩이 없는 국가는 국가 기본 정보에서 자동 fallback 카드를 보여줍니다.

## 3. 출발지 추가

`src/data/origins/index.json`에 추가합니다.

```json
{
  "id": "singapore",
  "countryCode": "SG",
  "timezone": "Asia/Singapore",
  "lat": 1.3521,
  "lon": 103.8198,
  "emoji": "🇸🇬",
  "names": {
    "ko": "싱가포르",
    "en": "Singapore",
    "ja": "シンガポール",
    "zh": "新加坡",
    "hi": "सिंगापुर",
    "de": "Singapur",
    "fr": "Singapour",
    "es": "Singapur",
    "pt": "Singapura",
    "ar": "سنغافورة",
    "id": "Singapura"
  }
}
```

UI 코드는 수정하지 않아도 select에 자동 반영됩니다.

## 4. 대표 도시/명소 추가

`src/data/places/index.json`:

```json
{
  "id": "busan",
  "name": "Busan",
  "nameKo": "부산",
  "type": "city",
  "countryCode": "KR",
  "lat": 35.1796,
  "lon": 129.0756,
  "timezone": "Asia/Seoul"
}
```

추천 type:

- `city`
- `landmark`
- `region`

장소 데이터가 수천 개 이상으로 증가하면 다음처럼 분할하세요.

```text
places/
├─ index.json
├─ asia.json
├─ europe.json
├─ africa.json
├─ americas.json
└─ oceania.json
```

## 5. 언어 추가

1. `src/modules/config.js`의 `supportedLocales`에 locale 추가
2. `src/modules/i18n.js`에 UI 번역 추가
3. `localeLabel()`에 표시명 추가
4. `origins/index.json`의 각 출발지 `names`에 번역 추가
5. 필요한 국가 knowledge JSON에 locale block 추가

국가명은 `Intl.DisplayNames`를 사용하므로 별도 국가명 번역표가 없어도 많은 브라우저에서 자동 현지화됩니다.

## 6. 이미지 데이터 확장

작은 프로젝트에서는 `gallery[].src`에 외부 URL을 넣을 수 있습니다.

운영 서비스에서는 권장 구조:

```text
public/content/
├─ kr/
│  ├─ palace.webp
│  ├─ jeju.webp
│  └─ food.webp
├─ jp/
│  ├─ fuji.webp
│  └─ tokyo.webp
└─ ...
```

그 후 knowledge JSON에는 상대 경로를 넣습니다.

```json
{
  "src": "./content/jp/fuji.webp"
}
```

WebP/AVIF를 우선 사용하고 원본 사진 라이선스를 반드시 확인하세요.

## 7. 이후 추가하기 좋은 데이터 영역

데이터가 커질 경우 아래 폴더를 별도로 추가하는 것을 권장합니다.

```text
src/data/
├─ animals/
├─ plants/
├─ foods/
├─ rivers/
├─ mountains/
├─ oceans/
├─ unesco/
├─ festivals/
├─ history/
├─ quizzes/
└─ curriculum/
```

이때 각 데이터는 ISO 국가코드 또는 장소 ID를 키로 연결합니다.

## 8. 자주 변하는 통계

GDP/GNI/인구 같은 값은 국가 JSON에 매년 수동 입력하기보다 API로 보강합니다.

현재 연결된 World Bank indicator:

- `SP.POP.TOTL` 인구
- `NY.GDP.MKTP.CD` GDP
- `NY.GNP.MKTP.CD` GNI/GNP 계열

API가 실패하면 내장 snapshot 값으로 계속 동작합니다.
