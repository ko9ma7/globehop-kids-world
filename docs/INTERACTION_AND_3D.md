# 2D / 3D Interaction Guide

## 사용자 흐름

```text
출발지 선택
→ 검색 또는 지도 직접 탐색
→ hover/tap으로 미니 정보
→ 국가/도시/명소 클릭
→ 목적지 변경
→ 화면 자동 zoom/focus
→ 비행기 경로 애니메이션
→ 거리·시간·시차·국가 학습자료 확인
```

## 2D 지도

### 국가

국가 전체 path가 클릭 영역입니다.

- hover: 국가명, 수도, 지역, 출발지 기준 거리
- click: 해당 국가의 수도 좌표로 여행
- keyboard: Tab으로 focus, Enter/Space로 선택

### 도시 / 명소

`src/data/places/index.json`의 모든 항목을 point로 렌더링합니다.

- 도시: 파란 point
- landmark: 노란 point
- hover: 이름/종류/국가/거리
- click: 해당 좌표로 즉시 여행

### 자동 줌

출발지·목적지의 2D projected bounding box를 구하고 margin을 더해 SVG `viewBox`를 easing으로 변경합니다.

## 3D 지구본

### 실제 3D인 이유

`globe3d.js`는 WebGL vertex/fragment shader와 sphere triangle mesh를 사용합니다.

CSS로 원형 clip만 적용한 화면이 아닙니다.

### 조작

Desktop:

- drag: 회전
- wheel: zoom
- hover: 국가/도시/명소 정보
- click: 여행

Mobile/Tablet:

- drag: 회전
- two-finger pinch: zoom
- tap: point/country 선택

### 국가 picking

포인터 위치에서 camera ray를 계산하고 unit sphere와 교차점을 구합니다.

```text
screen x/y
→ normalized device coordinate
→ view ray
→ ray/sphere intersection
→ inverse globe rotation
→ latitude/longitude
→ GeoJSON point-in-polygon
→ country
```

그래서 별도의 국가 pin이 없어도 구 표면을 직접 가리켜 국가를 찾을 수 있습니다.

### 도시/명소 picking

각 장소의 lat/lon을 unit sphere vector로 변환한 후 현재 globe rotation과 perspective camera를 적용해 화면 좌표로 projection합니다.

### 여행 자동 focus

출발지/목적지 vector의 spherical midpoint를 계산한 뒤 해당 midpoint가 화면 정면에 오도록 camera yaw/pitch를 보간합니다.

두 지점의 각거리(angular distance)에 따라 camera distance도 조절하므로 가까운 여행은 더 확대되고 먼 여행은 두 지점이 함께 보이도록 조금 더 멀어집니다.

### 비행 경로

출발/도착 vector 사이를 spherical interpolation하고 가운데로 갈수록 radius를 높여 arc를 만듭니다.

```text
surface radius ≈ 1.03
arc middle radius ≈ 1.37
```

비행기 역시 같은 경로를 따라 이동합니다.

## WebGL fallback

3D 초기화 실패 시:

- 앱 전체는 정상 유지
- 3D 버튼 disabled
- 2D 지도 자동 선택

따라서 WebGL 미지원 환경에서도 검색/거리/학습 기능을 사용할 수 있습니다.
