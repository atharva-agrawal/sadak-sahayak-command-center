import { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin } from "lucide-react";
import { mockCases } from "../mockCases";

const lightStyle = "https://tiles.openfreemap.org/styles/positron";
const darkStyle = "https://tiles.openfreemap.org/styles/dark";

type CityHotspot = {
  city: string;
  count: number;
  latitude: number;
  longitude: number;
  highSeverityCount: number;
  topViolation: string;
};

export function MapWidget() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const hotspots = useMemo<CityHotspot[]>(() => {
    const grouped = new Map<string, { count: number; latSum: number; lngSum: number; highSeverityCount: number; reasons: Map<string, number> }>();

    for (const item of mockCases) {
      const current = grouped.get(item.location) ?? {
        count: 0,
        latSum: 0,
        lngSum: 0,
        highSeverityCount: 0,
        reasons: new Map<string, number>(),
      };

      current.count += 1;
      current.latSum += item.latitude;
      current.lngSum += item.longitude;
      if (item.severity === "high") {
        current.highSeverityCount += 1;
      }
      current.reasons.set(item.reason, (current.reasons.get(item.reason) ?? 0) + 1);
      grouped.set(item.location, current);
    }

    return Array.from(grouped.entries())
      .map(([city, value]) => ({
        city,
        count: value.count,
        latitude: value.latSum / value.count,
        longitude: value.lngSum / value.count,
        highSeverityCount: value.highSeverityCount,
        topViolation: Array.from(value.reasons.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "N/A",
      }))
      .sort((left, right) => right.count - left.count);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const isDark = document.documentElement.classList.contains("dark");
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: isDark ? darkStyle : lightStyle,
      center: [82.0, 21.5],
      zoom: 5.6,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    const observer = new MutationObserver(() => {
      const nextDark = document.documentElement.classList.contains("dark");
      map.setStyle(nextDark ? darkStyle : lightStyle);
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    hotspots.forEach((spot) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = getMarkerClasses(spot.count);
      element.innerHTML = `<span>${spot.count}</span>`;

      const popup = new maplibregl.Popup({ offset: 18 }).setHTML(`
        <div style="min-width: 180px; font-family: sans-serif;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px;">${spot.city}</div>
          <div style="font-size: 12px; color: #475569; line-height: 1.6;">
            <div>Total cases: <strong>${spot.count}</strong></div>
            <div>High severity: <strong>${spot.highSeverityCount}</strong></div>
            <div>Top violation: <strong>${spot.topViolation}</strong></div>
          </div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element, anchor: "center" })
        .setLngLat([spot.longitude, spot.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [hotspots]);

  const totalCases = hotspots.reduce((sum, spot) => sum + spot.count, 0);
  const topCity = hotspots[0];

  return (
    <div className="relative h-full min-h-[300px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 dark:border-indigo-500/10 dark:bg-[#050B14]/40">
      <div ref={mapContainerRef} className="h-full w-full" />

      <div className="absolute left-4 top-4 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 shadow-md backdrop-blur dark:border-indigo-500/20 dark:bg-[#0A1222]/85">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          OpenFreeMap Live View
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-500 dark:text-slate-400">Cities tracked</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{hotspots.length}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Total cases</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{totalCases}</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 shadow-md backdrop-blur dark:border-indigo-500/20 dark:bg-[#0A1222]/85">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Highest Activity
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {topCity ? topCity.city : "No city data"}
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {topCity ? `${topCity.count} cases • ${topCity.topViolation}` : "Markers will appear when case data is available."}
        </p>
      </div>
    </div>
  );
}

function getMarkerClasses(count: number) {
  if (count >= 18) {
    return "flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-red-500 text-sm font-bold text-white shadow-[0_10px_25px_rgba(239,68,68,0.45)]";
  }

  if (count >= 10) {
    return "flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-amber-400 text-sm font-bold text-slate-900 shadow-[0_10px_25px_rgba(251,191,36,0.45)]";
  }

  return "flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-sm font-bold text-white shadow-[0_10px_25px_rgba(34,197,94,0.4)]";
}
