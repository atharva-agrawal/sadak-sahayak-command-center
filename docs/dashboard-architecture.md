# Dashboard Architecture

## Overview

Sadak Sahayak Command Center is currently implemented as a frontend-first React dashboard that simulates a police headquarters monitoring system. It is designed to help senior officers inspect violation cases, review hotspots, search case records, and view operational activity from the mobile app data model.

## Core Stack

- Frontend framework: React 18
- Build tool: Vite
- Routing: React Router
- Styling: Tailwind CSS with custom utility-driven component styling
- Animation: Motion
- Charts: Recharts
- Interactive map engine: MapLibre GL JS
- Free map provider / vector style source: OpenFreeMap
- Icons: Lucide React

## Data Layer

The project currently runs on mock frontend datasets instead of a live backend.

- Main case dataset: `src/app/mockCases.ts`
- Dashboard summary/mock widgets: `src/app/mockData.ts`
- Case image mapping: `src/app/caseMedia.ts`

The richer mock schema includes:

- case id
- user id
- violation reason
- notes
- latitude / longitude
- timestamp
- chat history
- language
- created_at
- user name
- vehicle number
- fine
- status
- severity
- location

## Main Application Structure

- `src/app/Layout.tsx`
  Shared shell for sidebar, top navigation, global search, theme toggle, profile entry, and route outlet.
- `src/app/pages/Dashboard.tsx`
  HQ overview page with KPI cards, hotspot map, live feed, trend chart, breakdown chart, and AI insight placeholder panel.
- `src/app/pages/CasesManagement.tsx`
  Detailed case table with filters, local search, paging, case drawer, and image preview overlay.
- `src/app/components/MapWidget.tsx`
  Interactive OpenFreeMap widget using MapLibre with city-level grouped case markers.
- `src/app/components/LiveFeed.tsx`
  Recent activity panel with officer-based navigation into challan management.

## Current Feature Architecture

### Global Search

Implemented in `Layout.tsx`.

- Searches across mock cases by case id, officer name, vehicle number, reason, and location.
- Returns a short suggestion list.
- Clicking a result navigates to challan management and opens the matching case drawer.

### Challan Management

Implemented in `CasesManagement.tsx`.

- URL-driven filters through search params.
- Local search inside the case table.
- Advanced filters for date, officer, and violation.
- Pagination with configurable page size.
- Right-side detail drawer for selected case.
- Full-screen evidence image preview.

### Dashboard Trend Analytics

Implemented in `Dashboard.tsx`.

- 7-day case volume chart derived from the richer `mockCases` dataset.
- Filterable by violation and officer.

### Geographic Hotspots

Implemented in `MapWidget.tsx`.

- Uses OpenFreeMap vector styles.
- Groups cases by location name.
- Averages latitude and longitude for each city marker.
- Popups show total case count, high-severity count, and most frequent violation.

## Current Limitations

- No backend/API integration yet.
- No authentication or RBAC enforcement yet.
- No persistent user profile/preferences storage yet.
- Bundle size is large and should be improved with route-level splitting and lazy loading.
- Dashboard summary values are still partially mocked instead of fully derived from the main dataset.

## Recommended Next Technical Steps

- Introduce route-level code splitting for dashboard, cases, and heavy map/image flows.
- Move derived analytics into shared selectors/helpers.
- Add a service layer for future Azure/API integration.
- Replace remaining static dashboard summary values with computed values from the unified case dataset.
