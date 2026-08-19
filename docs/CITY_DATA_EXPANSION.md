# GlobeHop V8 도시 데이터 확장 설계 및 운영 가이드

## 1. 이번 확장의 목표

V8의 핵심 목표는 기존의 "국가 중심 탐험"을 "국가 → 도시 → 도시 주변 장소"까지 자연스럽게 확장하는 것입니다.

기존 V7에서는 `src/data/places/index.json`의 소수 대표 도시/명소만 오프라인 검색할 수 있었고, 도시를 선택해도 대부분 국가 단위 학습 정보가 중심이었습니다.

V8에서는 다음 구조로 변경했습니다.

- 전 세계 도시 검색용 경량 인덱스: `src/data/cities/index.json`
- 도시 선택 시 런타임 상세 보강: `src/modules/cityInsights.js`
- 국가 선택 시 주요 도시 목록 자동 표시
- 도시 선택 시 도시 고유 정보 + 실시간 날씨 + 대기질 + 주변 Wikipedia 장소 표시
- 데이터 소스가 실패해도 로컬 도시 인덱스와 국가 정보로 계속 탐험 가능

현재 프로젝트에 포함한 도시 인덱스는 프로젝트가 지원하는 국가코드에 맞춰 **33,801개 도시 레코드**를 포함합니다.

## 2. 데이터 소스

### GeoNames — 도시 검색 인덱스

공식 데이터:

- https://download.geonames.org/export/dump/
- https://download.geonames.org/export/dump/readme.txt

사용 목적:

- 도시명
- 국가 코드
- 1차 행정구역 코드/명칭
- GeoNames ID
- 위도/경도
- 인구
- 시간대
- 지형/장소 feature code
- 고도

GeoNames Gazetteer 추출 데이터는 CC BY 4.0입니다. 서비스 내에서 GeoNames 출처 표기를 유지해야 합니다.

`cities15000`은 GeoNames 설명 기준으로 인구 15,000 초과 도시 또는 수도를 포함하는 도시 묶음입니다. 데이터는 정확성·최신성·완전성이 보증되지 않으므로 중요한 수치는 공식 도시/통계기관 데이터로 별도 보강하는 것이 좋습니다.

### Open-Meteo Geocoding — 도시 식별 보강

사용 목적:

- 검색어와 실제 도시의 대응
- 현지화된 도시명
- 행정구역명
- 우편번호가 제공되는 경우 우편번호
- 시간대
- 고도
- 인구 등 지리 메타데이터 보강

도시 인덱스에 좌표가 없거나 동일 이름 도시를 구분할 때 보조적으로 사용합니다.

### Open-Meteo Forecast — 현재/오늘 날씨

공식 문서:

- https://open-meteo.com/en/docs

현재 구현 필드:

- 현재 기온
- 체감온도
- 상대습도
- 강수
- 날씨 코드
- 풍속/돌풍/풍향
- 구름량
- 지표기압
- 가시거리
- 낮/밤 여부
- 오늘 최고/최저 기온
- 최대 강수확률
- 일출/일몰
- UV 지수

향후 쉽게 추가 가능한 필드:

- 구름량
- 가시거리
- 돌풍
- 적설량
- 강설
- 일조시간
- 이슬점
- 기압
- 풍향
- 월출/월몰
- 달의 위상
- 체감 최고/최저

### Open-Meteo Air Quality / CAMS — 대기질

공식 문서:

- https://open-meteo.com/en/docs/air-quality-api

현재 구현 필드:

- U.S. AQI
- European AQI
- PM2.5
- PM10
- UV Index

추가 가능한 필드:

- 오존 O3
- 이산화질소 NO2
- 이산화황 SO2
- 일산화탄소 CO
- 이산화탄소 CO2
- 암모니아(지원 지역)
- 먼지(dust)
- 에어로졸 광학두께
- 꽃가루(지원 지역)

대기질은 도시 관측소의 실측값과 정확히 동일한 개념이 아니라 모델 기반 자료일 수 있으므로 UI에서 "모델 기반"임을 알리는 것이 좋습니다.

### Wikipedia / MediaWiki Geosearch — 도시 소개와 주변 장소

공식 문서:

- https://www.mediawiki.org/wiki/API:Geosearch

현재 구현:

- 도시 이름으로 Wikipedia 페이지 검색
- 대표 이미지
- 짧은 도시 설명
- 도시 좌표 기준 주변 Wikipedia 장소 탐색
- 주변 장소 이미지/설명/거리 표시

이 구조를 활용하면 별도의 명소 DB를 모두 직접 만들지 않아도 도시마다 박물관, 기념물, 공원, 역사 장소 등 Wikipedia에 좌표가 붙은 페이지를 주변 지식 카드로 보여줄 수 있습니다.

Wikipedia 텍스트/이미지는 각각의 라이선스와 출처 조건을 따릅니다. 표시할 때 원문 링크를 유지하고, 대규모 재사용 시 Wikimedia 라이선스 정책을 별도로 확인해야 합니다.

### Wikidata — 도시 구조화 정보

공식 데이터 접근 안내:

- https://www.wikidata.org/wiki/Wikidata:Data_access

현재 구현한 도시 속성:

- 인구(P1082)
- 면적(P2046)
- 고도(P2044)
- 설립/시작 시점(P571)
- 공식 웹사이트(P856)
- 우편번호(P281)
- 전화 지역번호(P473)
- 공식명(P1448)
- 주민명/demonym(P1549)
- 별명(P1449)
- 표어(P1451)
- 시간대(P421)
- 공식 언어(P37)
- 자매도시(P190)

Wikidata 구조화 데이터는 CC0이며, 출처 요구가 강제되지는 않지만 서비스에서 Wikidata를 데이터 출처로 명시하는 것을 권장합니다.

## 3. 현재 도시 인덱스 스키마

`src/data/cities/index.json`은 파일 크기를 줄이기 위해 객체 배열 대신 압축된 row 배열을 사용합니다.

```json
{
  "fields": [
    "name",
    "countryCode",
    "admin1",
    "geonameId",
    "lat",
    "lon",
    "population",
    "timezone",
    "featureCode",
    "elevation"
  ],
  "cities": [
    ["Seoul", "KR", "11", 1835848, 37.566, 126.9784, 10349312, "Asia/Seoul", "PPLC", 38]
  ]
}
```

검색 인덱스에 긴 설명이나 이미지 URL을 넣지 않는 이유는 초기 다운로드 용량을 줄이기 위해서입니다. 긴 정보는 사용자가 실제 도시를 선택했을 때만 가져옵니다.

## 4. 도시 상세 화면에 현재 표시되는 정보

도시를 선택하면 다음 계층으로 정보가 합쳐집니다.

### A. 위치 기본 정보

- 도시명
- 국가
- 1차/2차 행정구역
- 위도/경도
- 시간대
- 고도
- 우편번호
- GeoNames ID

### B. 도시 규모/행정/역사 정보

- 인구
- 면적
- 설립/시작 연도
- 공식명
- 공식 언어
- 전화 지역번호
- 자매도시
- 주민 명칭
- 도시 별명
- 도시 표어
- 인구밀도(인구/면적 계산)
- 수도까지 직선거리
- 북/남·동/서 반구
- 도시 현지시간
- 공식 웹사이트

### C. 현재 환경 정보

- 현재 날씨
- 기온/체감온도
- 습도
- 풍속/돌풍/풍향
- 구름량/가시거리/지표기압
- 오늘 최고/최저
- 강수확률
- 일출/일몰
- U.S./European AQI
- PM2.5/PM10
- O3/NO2/SO2/CO/먼지
- UV

### D. 도시 지식 정보

- Wikipedia 도시 소개
- 대표 이미지
- 주변 Wikipedia 지식 장소
- 현재 도시와 가까운/관련 도시
- 같은 국가의 다른 도시

## 5. 나라를 선택했을 때 도시를 많이 보여주는 방식

국가 화면에서 `getCountryCitySuggestions()`가 해당 국가의 도시를 로컬 인덱스에서 찾고 인구 데이터를 우선하여 정렬합니다.

기본 UI는 상위 30개를 표시하지만 데이터 자체는 그보다 훨씬 많은 도시를 포함합니다.

필요하면 다음과 같이 쉽게 확대할 수 있습니다.

```js
const rows = await getCountryCitySuggestions(code2, { limit: 100 });
```

그러나 모바일 화면에서는 100개를 한 번에 그리는 것보다 다음 UX가 좋습니다.

1. 상위 20~30개 기본 표시
2. 행정구역 필터
3. 도시명 검색
4. "더 보기" 페이지네이션
5. 인구순 / 가나다순 / 거리순 전환

## 6. 앞으로 추가하면 가치가 큰 도시 정보

### 6.1 교육/어린이 친화 정보

GlobeHop 성격상 단순 여행 정보보다 다음 항목을 도시별 `cityProfile`에 큐레이션하면 차별화가 큽니다.

- "이 도시는 왜 유명할까?" 3문장
- 어린이가 알아두면 좋은 역사 3개
- 대표 건축물
- 대표 박물관
- 과학관
- 동물원/수족관
- 큰 공원
- 유명한 강/호수/바다
- 도시를 상징하는 동물/식물
- 대표 음식
- 대표 축제
- 대표 스포츠팀/스포츠 문화
- 유명한 인물
- 도시 별명
- 어린이용 재미있는 사실 5~10개
- 현지에서 자주 쓰는 인사말
- 간단한 퀴즈
- 다른 도시와 비교(인구/면적/기후)

이 정보는 자동 API만으로 품질을 보장하기 어려우므로 "주요 도시 500~1,000개"부터 수동 검수한 큐레이션 팩을 추가하는 방식을 권장합니다.

### 6.2 지리 정보

추가 후보:

- 해발고도
- 도시 면적
- 도시 중심 좌표
- 행정구역 계층
- 가까운 바다/강/산
- 거리 기준 가장 가까운 대도시
- 수도까지 거리
- 적도까지 거리
- 북극/남극까지 거리
- 반대편 지점(antipode)
- 도시의 일광시간 변화
- 계절별 평균 일출/일몰

### 6.3 기후 정보

Open-Meteo의 Historical/Climate 계열을 별도 호출하면 다음 카드도 만들 수 있습니다.

- 월별 평균 최고/최저기온
- 월별 평균 강수량
- 비가 가장 많은 달
- 가장 더운/추운 달
- 눈이 많이 오는 시기
- 계절 구분
- 최근 기온과 장기 평균 비교

현재 날씨와 "평년 기후"를 반드시 분리해서 표시해야 합니다.

### 6.4 관광/POI

OpenStreetMap/Overpass 또는 공식 관광/오픈데이터를 결합하면 다음 장소를 좌표 기반으로 찾을 수 있습니다.

- 박물관
- 미술관
- 도서관
- 공원
- 놀이공원
- 동물원
- 수족관
- 전망대
- 성/궁전
- 유적지
- 종교시설
- 시장
- 쇼핑거리
- 기차역
- 공항
- 항구

공용 Overpass 서버는 대규모 상업/고빈도 서비스용 저장소처럼 사용하지 말고 캐시·자체 인프라·공식 이용 정책을 고려해야 합니다.

### 6.5 UNESCO / 문화유산

도시와 반경 검색을 연결해 다음을 표시할 수 있습니다.

- UNESCO 세계유산
- 무형문화유산과 연관된 지역
- 역사적 도심
- 보호문화재

좌표가 있는 문화유산 데이터를 도시 반경과 교차시키면 "이 도시 주변 세계유산" 카드로 만들 수 있습니다.

### 6.6 교통

도시별로 다음을 확장할 수 있습니다.

- 주요 국제공항
- 공항 코드 IATA/ICAO
- 공항까지 거리
- 중앙역
- 지하철/도시철도 존재 여부
- 트램 여부
- 주요 대중교통 종류
- 자전거 공유
- 페리

실시간 운행정보가 필요하면 도시별 공식 GTFS/GTFS-Realtime 제공 여부를 확인해 별도 어댑터로 연결하는 것이 안전합니다.

### 6.7 생활/통계

공식 도시 통계나 국가 통계청 자료를 확보할 수 있는 주요 도시에서는 다음이 가능합니다.

- 인구 변화
- 인구밀도
- 연령대 분포
- 가구 수
- 관광객 수
- 면적
- 녹지 비율
- 주거 비용 지표
- 교육 시설 수
- 도서관/박물관 수

다만 국가별 정의와 조사연도가 달라 단순 순위 비교는 주의해야 합니다.

## 7. 권장 `cityProfile` 정적 큐레이션 스키마

API가 주는 사실과 별도로 어린이용 고품질 콘텐츠를 저장할 때 다음 구조를 권장합니다.

```json
{
  "geonameId": 1835848,
  "countryCode": "KR",
  "slug": "seoul",
  "names": {
    "ko": "서울",
    "en": "Seoul"
  },
  "summary": {
    "ko": "대한민국의 수도이자 가장 큰 도시권의 중심이에요."
  },
  "nicknames": [],
  "symbols": {
    "flower": null,
    "tree": null,
    "animal": null
  },
  "geography": {
    "river": ["Han River"],
    "mountains": [],
    "coast": false
  },
  "culture": {
    "foods": [],
    "festivals": [],
    "sports": [],
    "music": []
  },
  "kidHighlights": {
    "museums": [],
    "science": [],
    "parks": [],
    "zoosAquariums": []
  },
  "history": [],
  "funFacts": [],
  "quiz": [],
  "sources": []
}
```

권장 위치:

```text
src/data/city-profiles/
├─ index.json
├─ kr/
│  ├─ seoul.json
│  └─ busan.json
├─ jp/
│  ├─ tokyo.json
│  └─ osaka.json
└─ ...
```

## 8. 데이터 정확성에서 반드시 주의할 점

### "도시 인구"는 하나의 정의가 아니다

같은 서울/도쿄/파리도 자료에 따라 다음 중 무엇을 의미하는지 다를 수 있습니다.

- 행정시(city proper)
- 자치단체/시 경계
- 도시권(urban area)
- 광역권(metropolitan area)

GeoNames와 Wikidata 값이 서로 다를 수 있고, 갱신연도도 다를 수 있습니다.

따라서 UI에서는 가능하면:

- 값
- 기준 연도
- 출처
- 정의

를 함께 저장해야 합니다.

현재 V8은 Wikidata에서 인구값과 연도가 있으면 우선 표시하고, 없으면 GeoNames/Open-Meteo 값으로 fallback합니다.

### 같은 이름의 도시

Springfield, San José, Victoria처럼 같은 이름의 도시가 여러 국가/행정구역에 존재합니다.

도시의 내부 식별자는 이름 대신 다음 우선순위를 권장합니다.

1. GeoNames ID
2. Wikidata QID
3. `countryCode + admin1 + normalizedName`

### 자동 생성 설명은 검수 필요

어린이 대상 서비스라면 역사, 정치, 영토, 민족, 종교, 분쟁, 안전 정보는 Wikipedia 한 문장을 그대로 자동 노출하기보다 별도 검수 레이어를 두는 것이 좋습니다.

## 9. 성능 전략

현재 33,801개 도시는 검색에 필요한 최소 필드만 약 3 MB 수준의 JSON으로 묶었습니다.

도시를 100,000개 이상으로 확장할 경우 한 파일을 계속 키우지 말고 다음 구조로 분할하는 것이 좋습니다.

```text
cities/
├─ index.json              # 국가별 shard 위치/개수
├─ KR.json
├─ JP.json
├─ US-1.json
├─ US-2.json
├─ FR.json
└─ ...
```

또는 대륙 → 국가 2단계 shard를 사용할 수 있습니다.

검색 최적화 단계:

1. 도시명을 normalize한 별도 검색 key 생성
2. 국가코드별 offsets/index 생성
3. Web Worker에서 검색
4. IndexedDB에 도시 인덱스 캐시
5. 100k+에서는 prefix index 또는 MiniSearch/FlexSearch 같은 검색 인덱스 검토

GitHub Pages는 서버측 DB가 없으므로 "검색 최소 데이터는 정적", "선택한 도시의 상세는 API에서 지연 로딩"하는 현재 구조가 적합합니다.

## 10. 데이터 실패/오프라인 fallback

V8은 외부 데이터를 한 번에 모두 필수로 요구하지 않습니다.

예:

- Wikipedia 실패 → 소개/주변 장소만 생략
- Wikidata 실패 → GeoNames/Open-Meteo 기본 값 표시
- 날씨 실패 → 도시 정적 정보 계속 표시
- 대기질 실패 → 대기질 카드만 생략
- Open-Meteo Geocoding 실패 → 좌표가 있는 GeoNames 도시라면 그대로 탐험

이 방식은 무료 공개 API 한 곳의 장애가 전체 웹서비스 장애로 번지는 것을 줄입니다.

## 11. 추천 다음 확장 순서

### Phase A — 지금 V8에서 바로 이어서 하기

- 도시별 한글/현지어 alternate name 확대
- 국가 화면 도시 검색/필터 UI
- 인구순/이름순 정렬
- 도시 상세의 "더 보기" 접기/펼치기
- 날씨/대기질 카드에 데이터 시각 표시

### Phase B — 어린이 학습 강화

- 세계 주요 500개 도시 `cityProfile`
- 도시별 재미있는 사실 5개
- 대표 음식/축제/박물관/공원
- 도시별 퀴즈 3개
- "서울과 도쿄 비교" 같은 도시 비교 모드

### Phase C — 장소 데이터 강화

- UNESCO 매칭
- OSM POI 카테고리
- 공항/역/교통
- 강/산/호수
- 도시 반경 10/25/50 km 탐험

### Phase D — 대규모화

- 100k+ 도시 shard
- 별칭/현지어 검색
- Web Worker 검색
- IndexedDB 캐시
- API 응답 캐시/프록시 또는 정적 스냅샷 자동 생성 파이프라인

## 12. V8 주요 코드 위치

```text
src/data/cities/index.json        # 33,801개 도시 검색 인덱스
src/modules/dataService.js        # 도시 검색/국가별 도시/도시 위치 보강
src/modules/cityInsights.js       # 도시 상세 API 통합
src/modules/config.js             # 외부 API endpoint
src/modules/i18n.js               # 도시 UI 문구
src/app.js                        # 도시 상세/도시 디렉터리 렌더링
src/styles.css                    # 도시 상세 UI
public/sw.js                      # 캐시/API 네트워크 정책
```

## 13. 운영 시 출처 표기 권장 문구

서비스의 "데이터 출처" 영역에는 최소 다음을 유지하는 것을 권장합니다.

```text
City index: GeoNames (CC BY 4.0)
Weather & geocoding: Open-Meteo
Air quality: Open-Meteo / CAMS
City articles & nearby knowledge: Wikipedia / Wikimedia
Structured city facts: Wikidata (CC0)
Country statistics: World Bank
Road routing: OSRM / OpenStreetMap
```

각 API/데이터의 라이선스와 상업적 이용 조건은 배포 형태가 바뀔 때 다시 확인하세요.
