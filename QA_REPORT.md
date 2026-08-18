# GlobeHop QA Report

## Passed checks

- `npm install --package-lock-only` completed with zero reported vulnerabilities.
- `npm run build` completed successfully.
- JavaScript syntax check passed for all `src/*.js`, `src/modules/*.js`, and build/dev scripts.
- All bundled JSON/manifest/package files parse successfully.
- 232 country index entries resolve to a regional data shard.
- 12 curated knowledge-pack index entries resolve to existing country JSON files.
- All relative assets referenced directly by `index.html` exist.
- Production build contains `.nojekyll`, custom `404.html`, manifest, favicon/app icons, OG image, social preview, service worker and data files.
- Production build was tested with a project-pages URL (`https://example.github.io/globehop/`) and contains no unreplaced `__SITE_URL__` tokens.
- `dist/` is approximately 0.56 MB before HTTP compression, keeping the initial static project lightweight.

## Browser automation note

A Playwright/Chromium visual pass was attempted. This execution environment blocks both local HTTP and `file://` navigation inside Chromium with `ERR_BLOCKED_BY_ADMINISTRATOR`, so an actual rendered-browser screenshot could not be collected here. This is an environment policy restriction rather than a build error; the local Node server itself returned HTTP 200 through `curl`.

The project therefore received static build/path/accessibility/responsive-code checks in this environment. The repository includes no browser-specific build dependency, so it can be opened with `npm run dev` in a normal local browser for final visual inspection.
