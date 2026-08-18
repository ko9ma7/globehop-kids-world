# Data and attribution notes

GlobeHop is designed so that stable geography data can be bundled locally while volatile statistics can be refreshed from public APIs.

- The bundled country reference snapshot was generated from the `countryinfo` Python package (v0.1.2, MIT License), which provides country codes, capitals, coordinates, area, population snapshots, languages, currencies, borders, time zones and simplified GeoJSON for many countries.
- The curated `src/data/places/index.json` and `src/data/knowledge/*.json` files are project-authored starter data intended for educational use and extension.
- Optional live city/place lookup uses Open-Meteo's Geocoding API. Review Open-Meteo's current terms and commercial-use requirements before commercial deployment.
- Optional live GDP, GNI and population updates use the World Bank Indicators API v2.
- Animated travel paths are illustrative learning graphics. They are not real airline, railway or shipping routes and should not be used for navigation.
