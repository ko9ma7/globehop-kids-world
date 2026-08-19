# V5 — 2D / 3D 시각화 안정화

## 사용자 화면에서 확인한 문제

1. 2D 지도에서 확대 시 출발/도착 핀과 비행기 아이콘이 지도와 함께 수 배 커짐
2. 서울→일본처럼 가까운 경로에서 확대 범위가 지나치게 좁아 지리적 맥락이 사라짐
3. 3D에서 일본 국가 라벨, Tokyo 라벨, 목적지 핀, 주변 명소가 한곳에 겹침
4. 일본 전체 외곽을 카메라에 넣으려다 3D 지역 확대가 충분하지 않음

## 2D 수정 방식

`src/modules/globe.js`

- `viewBox` 확대 비율과 반대되는 마커 scale을 적용
- 도시 점, 핀, 비행기 모두 고정 시각 크기 유지
- 국가 GeoJSON의 projected bounds를 route fitting에 포함
- 최소 route view width를 190으로 제한해 과도한 확대 방지
- route stroke는 `vector-effect="non-scaling-stroke"` 적용

서울→도쿄 기준 계산값:

- viewBox 약 `190 × 95`
- 지도 확대 약 `5.26×`
- 비행기 원형 배경 화면 반경 약 `15.7px`
- 서울/도쿄 화면 간격 약 `171px` (925px 폭 기준)

## 3D 수정 방식

`src/modules/globe3d.js`

- 짧은 지역 경로(`< 0.30 rad`) 카메라 거리 기본값 `1.36`
- 전체 국가 외곽 fitting 대신 route midpoint 중심의 regional view 사용
- route endpoint가 safe frame 안에 있는지만 추가 검사
- 대한민국/일본 등 route 국가명은 globe texture에도 직접 기록
- 목적지가 국가일 경우 중복 destination city floating label 생략
- 선택 국가 landmark/city 표시 개수 제한
- route endpoint와 거의 동일한 위치의 일반 marker는 생략

서울→도쿄 기준 925×420 화면 예상 투영:

- 서울: 약 `(329, 185)`
- 도쿄: 약 `(596, 235)`
- 두 지점 간 화면 거리: 약 `266px`
- 대한민국 국가 중심: 약 `(339, 201)`
- 일본 국가 중심: 약 `(561, 228)`

따라서 이전처럼 대한민국/일본 라벨이 같은 위치에 몰리지 않도록 설계했습니다.

## QA URL

- 2D: `?c=JP&view=map`
- 3D: `?c=JP&view=globe`

## 배포 캐시

Service Worker cache version:

```js
const VERSION = 'globehop-v5-stable-map-20260818';
```
