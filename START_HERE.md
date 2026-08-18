# 여기서 시작하세요

이 폴더가 GlobeHop 전체 웹서비스 프로젝트입니다.

## 가장 먼저 실행

```bash
npm install
npm run dev
```

브라우저:

```text
http://localhost:5173/
```

## GitHub Pages 배포

1. 이 폴더의 파일을 GitHub Repository 루트에 그대로 업로드합니다.
2. 기본 브랜치를 `main`으로 설정합니다.
3. GitHub → Settings → Pages → Source를 **GitHub Actions**로 선택합니다.
4. push하면 `.github/workflows/deploy.yml`이 자동 배포합니다.

## 이미 빌드된 파일만 배포하려면

`dist/` 안의 내용이 완성된 정적 웹사이트입니다.

## 데이터 추가

- 국가 기본정보: `src/data/countries/`
- 출발지: `src/data/origins/index.json`
- 대표 도시/명소: `src/data/places/index.json`
- 아이용 학습자료: `src/data/knowledge/<국가코드>.json`

자세한 내용은 `README.md`와 `docs/`를 확인하세요.
