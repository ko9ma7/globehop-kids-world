# GlobeHop V8.5 — Navigation, zoom-aware cities, Korea tourism explorer

## What changed

- The first visit now opens **South Korea (KR)** instead of Japan.
- The last selected country/city/landmark is stored in localStorage and restored on the next visit.
- Selection URLs use `history.pushState`, so the browser Back button moves through previous GlobeHop selections.
- City/landmark detail headers expose **Previous** and **Back to country** controls.
- The selected country's full GeoNames city set is loaded into the map, while the UI still keeps a concise major-city directory.
- 2D city visibility is now zoom/viewport aware. More local cities appear as the user zooms into a region.
- 3D marker density also grows with camera zoom; marker sizes now change moderately with zoom instead of remaining visually identical.
- Korea gets an enhanced tourism layer with Korean city aliases, 26 city tourism profiles and 81 curated tourism points.
- City detail pages can show a horizontal photo-tour carousel using Wikipedia/Wikimedia images from the city and nearby/tourism pages.

## Korea priority behavior

Korean city aliases are bundled locally for major cities so Korean-language searches such as 서울, 부산, 경주, 강릉, 속초, 전주 and 여수 match the local city index without depending on online geocoding.

Tourism profiles currently cover Seoul, Busan, Incheon, Daegu, Gwangju, Daejeon, Suwon, Jeonju, Ulsan, Cheongju, Jeju City, Seogwipo, Gyeongju, Gangneung, Sokcho, Chuncheon, Yeosu, Suncheon, Andong, Pohang, Mokpo, Gunsan, Gongju, Boryeong, Tongyeong and Geoje.

## Map density behavior

The full selected-country city list is available to the map, but markers are filtered by viewport and zoom level to avoid thousands of simultaneous SVG/canvas markers. At deeper zoom levels the limit rises substantially, so smaller cities become discoverable.
