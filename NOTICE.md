# Notices and external services

GlobeHop is an educational static web project. The application code is released under the MIT License.

## Bundled country reference data

The country reference snapshot was prepared from open country metadata available to the project authoring environment. Values such as population can age, so the app may replace selected statistics with current World Bank API results when online.

## Open-Meteo Geocoding

Used as an optional online city/place search helper. Review Open-Meteo's current licensing and commercial-use terms before production use.

## World Bank Indicators API

Used as optional online enrichment for population, GDP and GNI-related indicators. World Bank API terms and dataset licenses apply.

## OSRM

The app can request an OSRM driving route to obtain road-network distance and duration. The public OSRM endpoint is treated as a best-effort helper, not a guaranteed production backend. For a high-traffic service, use an appropriately hosted/contracted routing service.

## Images

Country flags can be loaded from FlagCDN. Selected educational content packs may reference Wikimedia Commons images. External image licenses and attribution requirements remain the responsibility of the deployer. For a controlled production deployment, replace remote image URLs with licensed local assets under `public/content/`.
