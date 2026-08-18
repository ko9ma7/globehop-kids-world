const STRINGS = {
  ko: {
    tagline: '검색하고, 움직이고, 지구를 알아가요',
    searchPlaceholder: '나라·도시·지명을 검색해 보세요',
    searchHint: '예: 일본, 파리, 후지산, 부산',
    search: '검색',
    countries: '나라', places: '도시와 지명', onlinePlaces: '온라인 장소 검색',
    usingExampleOrigin: '서울을 예시 출발지로 사용 중', useMyLocation: '내 위치 사용', locationReady: '내 위치가 출발지예요', locationDenied: '위치 권한을 사용할 수 없어 예시 출발지를 유지합니다.',
    exploreTitle: '오늘은 어디로 가볼까요?', exploreBody: '검색 결과를 고르면 지구본에 여행 경로가 나타납니다.',
    route: '여행 경로', replay: '다시 출발', transport: '이동수단', plane: '비행기', ship: '배', train: '기차',
    distance: '거리', timeDiff: '시차', localTime: '현지 시간',
    countryFacts: '나라 기본 정보', capital: '수도', population: '인구', area: '면적', gdp: 'GDP', gni: 'GNI',
    currency: '통화', languages: '언어', region: '지역', callingCode: '국가번호',
    liveStat: 'World Bank 최신 통계', staticStat: '내장 데이터 스냅샷', unavailable: '자료 없음', loading: '불러오는 중…',
    kidKnowledge: '아이와 함께 보는 한눈 지식', specialties: '대표 먹거리·산물', animals: '동물', plants: '식물', funFacts: '알아두면 재미있는 것',
    knowledgeFallback: '이 나라의 기본 정보는 바로 볼 수 있고, 자연·문화 지식 팩은 국가별 JSON을 추가해 확장할 수 있습니다.',
    favorite: '즐겨찾기', unfavorite: '즐겨찾기 해제', recent: '최근 탐험', favorites: '즐겨찾기', noRecent: '아직 탐험 기록이 없어요.',
    dataSources: '데이터 출처와 안내', dataSourceBody: '국가 기본 데이터는 프로젝트에 포함된 정적 데이터이고, 도시 검색은 Open-Meteo Geocoding API를 보조적으로 사용합니다. GDP·GNI·최신 인구는 World Bank Indicators API 연결 시 갱신됩니다. 여행 선은 실제 교통 노선이 아니라 학습용 시각화입니다.',
    close: '닫기', theme: '테마', light: '라이트', dark: '다크', system: '시스템',
    noResults: '검색 결과가 없어요. 다른 철자나 더 큰 도시 이름으로 찾아보세요.',
    networkFallback: '온라인 검색이 연결되지 않았지만, 내장된 나라와 대표 지명은 계속 검색할 수 있습니다.',
    city: '도시', landmark: '명소', regionPlace: '지역', country: '나라',
    locationPrivacy: '위치 정보는 경로 계산에만 사용하며 이 서비스가 서버에 저장하지 않습니다.',
    onlineDataError: '최신 통계를 불러오지 못해 내장 값을 표시합니다.',
    exploreAnother: '다른 곳 검색', sourceYear: '기준',
    footer: 'GlobeHop · 아이를 위한 세계 탐험 지도'
  },
  en: {
    tagline: 'Search, travel, and discover the world', searchPlaceholder: 'Search a country, city, or place', searchHint: 'Try Japan, Paris, Mount Fuji, Busan', search: 'Search', countries: 'Countries', places: 'Cities & places', onlinePlaces: 'Online place search',
    usingExampleOrigin: 'Using Seoul as the sample origin', useMyLocation: 'Use my location', locationReady: 'Your location is the origin', locationDenied: 'Location is unavailable, so the sample origin remains.',
    exploreTitle: 'Where should we go today?', exploreBody: 'Choose a result and a travel path will appear on the globe.', route: 'Journey', replay: 'Replay', transport: 'Transport', plane: 'Plane', ship: 'Ship', train: 'Train',
    distance: 'Distance', timeDiff: 'Time difference', localTime: 'Local time', countryFacts: 'Country facts', capital: 'Capital', population: 'Population', area: 'Area', gdp: 'GDP', gni: 'GNI', currency: 'Currency', languages: 'Languages', region: 'Region', callingCode: 'Calling code',
    liveStat: 'Latest World Bank statistic', staticStat: 'Bundled data snapshot', unavailable: 'Unavailable', loading: 'Loading…', kidKnowledge: 'Kid-friendly knowledge', specialties: 'Foods & products', animals: 'Animals', plants: 'Plants', funFacts: 'Fun facts', knowledgeFallback: 'Core country facts are available now. Nature and culture packs can be expanded by adding one JSON file per country.',
    favorite: 'Favorite', unfavorite: 'Remove favorite', recent: 'Recent trips', favorites: 'Favorites', noRecent: 'No trips yet.', dataSources: 'Data sources & notes', dataSourceBody: 'Core country facts are bundled as static data. City search optionally uses Open-Meteo Geocoding API. GDP, GNI, and recent population update when the World Bank Indicators API is available. Travel lines are educational visualizations, not real transport routes.', close: 'Close', theme: 'Theme', light: 'Light', dark: 'Dark', system: 'System',
    noResults: 'No results. Try another spelling or a larger nearby city.', networkFallback: 'Online search is unavailable, but bundled countries and featured places still work.', city: 'City', landmark: 'Landmark', regionPlace: 'Region', country: 'Country', locationPrivacy: 'Your location is used only for route calculations and is not stored by this service on a server.', onlineDataError: 'Latest statistics could not be loaded, so bundled values are shown.', exploreAnother: 'Search another place', sourceYear: 'Year', footer: 'GlobeHop · A world explorer for kids'
  },
  ja: {
    tagline:'検索して、移動して、世界を知ろう', searchPlaceholder:'国・都市・地名を検索', searchHint:'例：日本、パリ、富士山、釜山', search:'検索', countries:'国', places:'都市・地名', onlinePlaces:'オンライン地名検索', usingExampleOrigin:'ソウルを例の出発地として使用中', useMyLocation:'現在地を使う', locationReady:'現在地を出発地に設定しました', locationDenied:'位置情報を使えないため、例の出発地を使います。', exploreTitle:'今日はどこへ行く？', exploreBody:'検索結果を選ぶと、地球儀に旅のルートが表示されます。', route:'旅のルート', replay:'もう一度', transport:'移動手段', plane:'飛行機', ship:'船', train:'列車', distance:'距離', timeDiff:'時差', localTime:'現地時刻', countryFacts:'国の基本情報', capital:'首都', population:'人口', area:'面積', gdp:'GDP', gni:'GNI', currency:'通貨', languages:'言語', region:'地域', callingCode:'国番号', liveStat:'World Bank 最新統計', staticStat:'内蔵データ', unavailable:'データなし', loading:'読み込み中…', kidKnowledge:'子ども向けミニ知識', specialties:'食べ物・特産品', animals:'動物', plants:'植物', funFacts:'おもしろ知識', knowledgeFallback:'基本情報は利用できます。自然・文化データは国別JSONを追加して拡張できます。', favorite:'お気に入り', unfavorite:'お気に入り解除', recent:'最近の探検', favorites:'お気に入り', noRecent:'まだ探検記録がありません。', dataSources:'データ出典', dataSourceBody:'国の基本情報は静的データ、都市検索はOpen-Meteo Geocoding APIを補助利用します。GDP・GNI・人口はWorld Bank API接続時に更新します。ルート線は学習用で、実際の交通経路ではありません。', close:'閉じる', theme:'テーマ', light:'ライト', dark:'ダーク', system:'システム', noResults:'結果がありません。別の表記や大きな都市名を試してください。', networkFallback:'オンライン検索に接続できませんが、内蔵データは使えます。', city:'都市', landmark:'名所', regionPlace:'地域', country:'国', locationPrivacy:'位置情報は経路計算のみに使い、このサービスのサーバーには保存しません。', onlineDataError:'最新統計を取得できないため内蔵値を表示します。', exploreAnother:'別の場所を検索', sourceYear:'基準年', footer:'GlobeHop · 子どものための世界探検'
  },
  zh: {
    tagline:'搜索、出发、认识世界', searchPlaceholder:'搜索国家、城市或地名', searchHint:'例如：日本、巴黎、富士山、釜山', search:'搜索', countries:'国家', places:'城市与地点', onlinePlaces:'在线地点搜索', usingExampleOrigin:'当前使用首尔作为示例出发地', useMyLocation:'使用我的位置', locationReady:'已将当前位置设为出发地', locationDenied:'无法使用位置权限，继续使用示例出发地。', exploreTitle:'今天想去哪里？', exploreBody:'选择搜索结果后，地球仪会显示旅行路线。', route:'旅行路线', replay:'重新出发', transport:'交通方式', plane:'飞机', ship:'船', train:'火车', distance:'距离', timeDiff:'时差', localTime:'当地时间', countryFacts:'国家基础信息', capital:'首都', population:'人口', area:'面积', gdp:'GDP', gni:'GNI', currency:'货币', languages:'语言', region:'地区', callingCode:'国际区号', liveStat:'World Bank 最新统计', staticStat:'内置数据快照', unavailable:'暂无数据', loading:'加载中…', kidKnowledge:'儿童友好知识', specialties:'特色食物与产品', animals:'动物', plants:'植物', funFacts:'有趣知识', knowledgeFallback:'基础国家信息可以直接查看。自然与文化知识可通过新增国家JSON文件继续扩展。', favorite:'收藏', unfavorite:'取消收藏', recent:'最近探索', favorites:'收藏', noRecent:'还没有探索记录。', dataSources:'数据来源与说明', dataSourceBody:'国家基础信息来自项目内置静态数据；城市搜索可辅助使用Open-Meteo Geocoding API；GDP、GNI和近期人口在World Bank API可用时更新。路线仅用于学习可视化，并非真实交通线路。', close:'关闭', theme:'主题', light:'浅色', dark:'深色', system:'跟随系统', noResults:'没有找到结果。请尝试其他拼写或附近更大的城市。', networkFallback:'在线搜索暂不可用，但内置国家和代表地点仍可搜索。', city:'城市', landmark:'地标', regionPlace:'地区', country:'国家', locationPrivacy:'位置信息仅用于计算路线，本服务不会将其存储到服务器。', onlineDataError:'无法加载最新统计，正在显示内置数据。', exploreAnother:'搜索其他地点', sourceYear:'年份', footer:'GlobeHop · 儿童世界探索地图'
  }
};

export function translator(locale) {
  const dict = STRINGS[locale] || STRINGS.ko;
  return (key) => dict[key] ?? STRINGS.en[key] ?? key;
}

export function localeLabel(locale) {
  return { ko:'한국어', en:'English', ja:'日本語', zh:'中文' }[locale] || locale;
}
