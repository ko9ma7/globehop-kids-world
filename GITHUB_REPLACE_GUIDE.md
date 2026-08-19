# GitHub Pages — V5 교체 방법

현재 GitHub 저장소 루트에 정적 파일을 직접 업로드해서 Pages를 운영한다면 **`GlobeHop_3D_V5_GITHUB_PAGES_DIST.zip`**을 사용하세요.

1. ZIP 압축을 풉니다.
2. ZIP 안의 파일/폴더를 저장소 루트에 그대로 업로드합니다.
3. 기존 `index.html`, `src/`, `sw.js`, `404.html`, `manifest.webmanifest` 등을 V5 파일로 교체합니다.
4. GitHub Pages 배포가 끝난 뒤 사이트를 엽니다.
5. 페이지 하단에 **V5.0**이 보이는지 확인합니다.
6. 서울 → 일본에서 2D/3D를 각각 확인합니다.

## 반드시 바뀌어야 하는 파일

- `index.html`
- `src/app.js`
- `src/styles.css`
- `src/modules/globe.js`
- `src/modules/globe3d.js`
- `sw.js`

## 캐시 확인

V5 `sw.js` 첫 줄:

```js
const VERSION = 'globehop-v5-stable-map-20260818';
```

사이트 하단이 V5.0이 아니면 이전 배포/캐시를 보고 있는 것입니다.


## V7 확인 포인트
- 사이트 하단 `V7.0` 표시
- 3D 확대 시 대한민국/일본 글자가 지구 표면과 함께 커지지 않음
- 2D 지도에서 마우스 휠 확대/축소
- 2D 지도에서 드래그 이동
- 모바일 pinch 확대/축소
- 지도 오른쪽의 `+ / -` 버튼이 2D와 3D 모두 동작
