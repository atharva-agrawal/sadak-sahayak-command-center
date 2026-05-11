# Dashboard User Flow

## Primary User

The current dashboard is designed for a police headquarters or command-center officer who supervises case activity, hotspot locations, and field operations.

## Main Entry Experience

When the officer opens the dashboard:

- They land on the main command center overview.
- They see top KPI cards for case activity and officers.
- They can inspect hotspot cities on the interactive map.
- They can review recent officer actions from the live feed.
- They can use the global top-bar search to jump directly to matching cases.

## What The Officer Can Do

### From Dashboard KPIs

- Click `Today's Cases`
- Click `Pending Actions`
- Click `Active Officers`

Each of these currently routes to challan management for deeper inspection.

### From Live Officer Feed

- Review recent field actions.
- Click an officer name.
- Land on challan management with that officer filter auto-applied.

### From Global Search

- Type case id, officer name, vehicle number, reason, or location.
- See short suggestions in the top bar.
- Click a suggestion.
- Land in challan management with the selected case drawer already opened.

### From Geographic Hotspots

- Pan and zoom the interactive map.
- Click a city marker.
- View city-level case count, high-severity count, and top violation in the popup.

### From 7-Day Case Volume

- Review the last 7 days of case volume.
- Filter the chart by violation type.
- Filter the chart by officer.

### From Challan Management

- Review the case table.
- Search by case id, officer, vehicle, violation, location, or status.
- Apply advanced filters for date, officer, and violation.
- Change how many cases are visible per page.
- Move between paginated result pages.

### From Case Detail Drawer

- Open a case by clicking any row in challan management.
- Review officer information, case overview, timestamps, location, notes, and chat history.
- Review case evidence images when available.
- Click an image to open a full-screen preview with blurred background.

### From Profile

- Open the profile panel from the header profile area.
- View placeholder identity, role, account, and system preference sections.

## Current Navigation Summary

- `/`
  Dashboard overview
- `/cases`
  Challan management
- `/cases?officer=...`
  Challan management filtered by officer
- `/cases?search=...`
  Challan management filtered by free-text search
- `/cases?caseId=...`
  Challan management with selected case drawer opened

## Current Product Intent

The dashboard currently supports three major officer tasks:

- monitor overall operational activity
- investigate individual challan cases
- inspect location-based hotspots and trends

As backend integration is added later, this same flow can support live mobile-app data and Azure-powered analytics without changing the core operator journey too much.
