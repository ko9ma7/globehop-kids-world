# GlobeHop Architecture

## Goal

A static, GitHub Pages-friendly educational explorer that feels interactive without requiring a private backend.

## Runtime flow

1. Load a 49 KB country search index, the featured place index and simplified globe geometry.
2. Render the default trip (Seoul sample origin → selected destination).
3. Search local bundled countries/places instantly.
4. Optionally enrich place search through Open-Meteo Geocoding.
5. Lazy-load one regional country file after selection.
6. Lazy-load one country knowledge JSON file after selection.
7. Optionally fetch current World Bank population/GDP/GNI.
8. Keep recent trips, favorites, language and theme in `localStorage`.

## Why no heavy map library?

The brief calls for a child-friendly, non-detailed globe rather than a navigation map. The app therefore uses a lightweight SVG equirectangular globe with simplified country geometry. This avoids a large mapping dependency and keeps GitHub Pages loading fast.

## Route model

`geo.js` computes a great-circle-style distance using the Haversine formula. The visible SVG route is a curved educational path between projected points. Users can switch among plane, ship and train. The default suggestion is heuristic and never claims to be an actual transport service.

## Privacy

Browser geolocation is requested only after the user presses the location button. Coordinates remain in page memory and are used for distance and time-difference calculations. This project does not send them to a project-owned server or persist precise coordinates to localStorage.

## Static hosting strategy

All local assets use relative URLs. The build script injects the deployment URL only into canonical/OG/sitemap metadata. This makes the same project work at both:

- `https://USERNAME.github.io/REPOSITORY/`
- `https://USERNAME.github.io/` for user/organization pages
- a future custom domain
