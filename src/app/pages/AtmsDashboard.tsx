import { useEffect, useRef, useState, useMemo } from "react";
import { useMsal } from "@azure/msal-react";
import { Navigation, ShieldAlert, FileText, User, Radio, MapPin, AlertCircle, Clock, Eye, EyeOff, Phone, ArrowUpRight, Activity, UserCheck, RefreshCw, Plus, X } from "lucide-react";
import { mockCases } from "../mockCases";
import { backendScopes, fetchBackendCasesOnce, type BackendCase } from "../services/backendCases";
import { acquireBackendAccessToken } from "../services/authToken";
import { fetchBackendLocations, type BackendLocation } from "../services/backendLocations";
import { fetchMonitoredRoads, type MonitoredRoad } from "../services/backendRoads";
import { fetchAssignments, createAssignment, type Assignment } from "../services/backendAssignments";

// Access Google Maps from window
const google = (window as any).google;

type Officer = {
  id: string;
  name: string;
  badge: string;
  status: "Active" | "Patrol" | "Break" | "Incident";
  speed: number;
  vehicle: string;
  coords: [number, number];
  phone: string;
  lastReport: string;
};

type OfficerReport = {
  id: string;
  officerName: string;
  timeAgo: string;
  location: string;
  coords: [number, number];
  content: string;
  severity: "low" | "medium" | "high";
};

type ActiveOfficer = {
  id: string;
  name: string;
  coords: [number, number];
  recordedAt: string | Date;
  badge?: string;
  status?: string;
  speed?: number;
  vehicle?: string;
  phone?: string;
  lastReport?: string;
};

// ─── DSS Helper Functions ───────────────────────────────────────────────────
function decodePolyline(encoded: string) {
  const pts: { lat: number; lng: number }[] = [];
  let idx = 0, lat = 0, lng = 0;
  while (idx < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(idx++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(idx++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;
    pts.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return pts;
}

function calculateSeverity(durS?: string, statS?: string, intervals?: any[]) {
  if (!durS || !statS) return { score: 0, label: "LOW" as const };
  const ratio = parseInt(durS) / parseInt(statS);
  const segs = intervals || [];
  const total = segs.length || 1;
  const jams = segs.filter((s: any) => s.speed === "TRAFFIC_JAM").length / total;
  const slow = segs.filter((s: any) => s.speed === "SLOW").length / total;
  const score = Math.min(100, Math.max(0, Math.round((ratio - 1) * 80 + jams * 25 + slow * 10)));
  const label = score >= 40 ? ("HIGH" as const) : score >= 12 ? ("MEDIUM" as const) : ("LOW" as const);
  return { score, label };
}

async function fetchRoute(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
  offsetMs: number,
  apiKey: string
) {
  const depTime = new Date(Date.now() + offsetMs).toISOString();
  const body = {
    origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
    destination: { location: { latLng: { latitude: dest.lat, longitude: dest.lng } } },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE_OPTIMAL",
    departureTime: depTime,
    extraComputations: ["TRAFFIC_ON_POLYLINE"],
    polylineQuality: "HIGH_QUALITY",
  };
  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "routes.duration",
        "routes.staticDuration",
        "routes.distanceMeters",
        "routes.travelAdvisory.speedReadingIntervals",
        "routes.polyline.encodedPolyline",
      ].join(","),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export function AtmsDashboard() {
  const { instance, accounts } = useMsal();
  const [cases, setCases] = useState<BackendCase[]>([]);
  const [liveOfficers, setLiveOfficers] = useState<BackendLocation[]>([]);
  const [loadError, setLoadError] = useState("");
  const [mapType, setMapType] = useState<"cases" | "location" | "dss" | "allocation">("location");
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(null);
  const [showPOIs, setShowPOIs] = useState(false);
  const isLiveData = liveOfficers.length > 0;

  // Assignments State
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedRoadForAssign, setSelectedRoadForAssign] = useState<MonitoredRoad | null>(null);
  const [selectedOfficerForAllocate, setSelectedOfficerForAllocate] = useState<string | null>(null);
  const [isRefreshingAssignments, setIsRefreshingAssignments] = useState(false);
  const [dismissedRejections, setDismissedRejections] = useState<number[]>([]);

  // Filter non-dismissed rejected assignments for the top alert notification box
  const activeRejections = useMemo(() => {
    return assignments.filter(
      (a) => a.status === "REJECTED" && !dismissedRejections.includes(a.id)
    );
  }, [assignments, dismissedRejections]);

  // Refresh officer status & assignments from backend
  const handleRefreshAssignments = async () => {
    setIsRefreshingAssignments(true);
    try {
      const token = await acquireBackendAccessToken(instance, accounts, backendScopes);
      if (token) {
        const fresh = await fetchAssignments(token);
        setAssignments(fresh);
        try {
          const freshLocs = await fetchBackendLocations(token);
          setLiveOfficers(freshLocs);
        } catch (locErr) {
          console.error("Failed to refresh live locations:", locErr);
        }
      }
    } catch (err) {
      console.error("Failed to refresh assignments from server:", err);
    } finally {
      setIsRefreshingAssignments(false);
    }
  };


  // DSS State
  const [monitoredRoads, setMonitoredRoads] = useState<MonitoredRoad[]>([]);
  const [dssRoadsData, setDssRoadsData] = useState<Array<{
    road: MonitoredRoad;
    cur: any;
    pred: any;
    curSeverity: { score: number; label: "HIGH" | "MEDIUM" | "LOW" };
    predSeverity: { score: number; label: "HIGH" | "MEDIUM" | "LOW" };
    curPriorityScore: number;
    predPriorityScore: number;
    trend: "worsening" | "stable" | "clearing";
  }>>([]);
  const [isDssLoading, setIsDssLoading] = useState(false);
  const [dssError, setDssError] = useState("");
  const [selectedRoadId, setSelectedRoadId] = useState<number | null>(null);
  const [dssSubTab, setDssSubTab] = useState<"current" | "predicted">("current");

  // Map references
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const trafficLayerRef = useRef<any>(null);
  const activeInfoWindowRef = useRef<any>(null);

  // Load cases, locations, and assignments from backend or fallback
  useEffect(() => {
    const loadData = async () => {
      try {
        const accessToken = await acquireBackendAccessToken(instance, accounts, backendScopes);
        if (!accessToken) return;

        // Fetch cases
        try {
          const casesData = await fetchBackendCasesOnce(accessToken);
          setCases(casesData);
        } catch (err) {
          console.error("Failed to load cases:", err);
        }

        // Fetch locations
        try {
          const locationsData = await fetchBackendLocations(accessToken);
          setLiveOfficers(locationsData);
        } catch (err) {
          console.error("Failed to load live locations:", err);
        }

        // Fetch assignments
        try {
          const assignmentsData = await fetchAssignments(accessToken);
          setAssignments(assignmentsData);
        } catch (err) {
          console.error("Failed to load assignments:", err);
        }
      } catch (err) {
        console.error("Auth token acquisition or fetch failed:", err);
      }
    };
    void loadData();
  }, [accounts, instance]);

  // DSS fetch function — calls backend for road list + Google Routes API for each road
  const fetchDssData = async () => {
    setIsDssLoading(true);
    setDssError("");
    try {
      const accessToken = await acquireBackendAccessToken(instance, accounts, backendScopes);
      if (!accessToken) { setDssError("Auth token unavailable."); return; }
      const roads = await fetchMonitoredRoads(accessToken);
      setMonitoredRoads(roads);
      const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
      if (!apiKey) { setDssError("VITE_GOOGLE_MAPS_API_KEY not set."); return; }

      const results = await Promise.all(
        roads.map(async (road) => {
          const origin = { lat: road.origin_lat, lng: road.origin_lng };
          const dest   = { lat: road.destination_lat, lng: road.destination_lng };
          try {
            const [curData, predData] = await Promise.all([
              fetchRoute(origin, dest, 2 * 60 * 1000, apiKey),
              fetchRoute(origin, dest, 32 * 60 * 1000, apiKey),
            ]);
            const cur  = curData.routes?.[0];
            const pred = predData.routes?.[0];
            const curSeverity  = calculateSeverity(cur?.duration, cur?.staticDuration, cur?.travelAdvisory?.speedReadingIntervals);
            const predSeverity = calculateSeverity(pred?.duration, pred?.staticDuration, pred?.travelAdvisory?.speedReadingIntervals);
            const trendDelta   = predSeverity.score - curSeverity.score;
            const curPriorityScore = parseFloat((curSeverity.score * road.priority_weight).toFixed(1));
            const predPriorityScore = parseFloat((predSeverity.score * road.priority_weight).toFixed(1));
            const trend = trendDelta >= 10 ? "worsening" : trendDelta <= -10 ? "clearing" : "stable";
            return { road, cur, pred, curSeverity, predSeverity, curPriorityScore, predPriorityScore, trend };
          } catch {
            return { road, cur: null, pred: null,
              curSeverity: { score: 0, label: "LOW" as const },
              predSeverity: { score: 0, label: "LOW" as const },
              curPriorityScore: 0, predPriorityScore: 0, trend: "stable" as const };
          }
        })
      );
      setDssRoadsData(results);
      if (results.length > 0) setSelectedRoadId(results[0].road.id);
    } catch (err: any) {
      setDssError(err?.message || "Failed to load DSS data.");
    } finally {
      setIsDssLoading(false);
    }
  };

  // Trigger DSS fetch when tab is activated & set up a 30-minute auto-refresh interval
  useEffect(() => {
    if (mapType === "dss" || mapType === "allocation") {
      if (dssRoadsData.length === 0 && !isDssLoading) {
        void fetchDssData();
      }

      const interval = setInterval(() => {
        void fetchDssData();
      }, 30 * 60 * 1000); // 30 minutes in milliseconds

      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapType]);

  // Dictionary keyed by officer_id for active/pending assignments
  const assignedMap = useMemo(() => {
    const map: Record<string, Assignment> = {};
    assignments.forEach((a) => {
      if (a.status === "PENDING" || a.status === "ACTIVE") {
        map[a.officer_id] = a;
      }
    });
    return map;
  }, [assignments]);

  // Instant in-memory officer assignment function
  const handleAssignOfficer = async (road: MonitoredRoad, officer: ActiveOfficer, severity: string) => {
    console.log("👮 [handleAssignOfficer] Triggered officer assignment:", {
      road_id: road.id,
      road_name: road.name,
      officer_id: officer.id,
      officer_name: officer.name,
      severity,
    });

    const tempAssignment: Assignment = {
      id: Date.now(),
      road_id: road.id,
      road_name: road.name,
      officer_id: officer.id,
      officer_name: officer.name,
      assigned_by_id: "supervisor-1",
      assigned_by_name: "Command Center Supervisor",
      assigned_at: new Date().toISOString(),
      responded_at: null,
      released_at: null,
      status: "PENDING",
      rejection_reason: null,
      notes: null,
    };

    // Instant UI update in React state
    console.log("⏳ [handleAssignOfficer] Applying optimistic UI update with temp ID:", tempAssignment.id);
    setAssignments((prev) => [tempAssignment, ...prev]);
    setSelectedRoadForAssign(null);

    // Background API call — passes severity so backend FCM notification body is accurate
    try {
      console.log("🔑 [handleAssignOfficer] Acquiring auth token...");
      const token = await acquireBackendAccessToken(instance, accounts, backendScopes);
      if (token) {
        console.log("🚀 [handleAssignOfficer] Calling createAssignment service...");
        const realAss = await createAssignment(token, {
          road_id: road.id,
          road_name: road.name,
          officer_id: officer.id,
          officer_name: officer.name,
          severity,  // e.g. "HIGH" | "MEDIUM" | "LOW" from DSS curSeverity.label
        });
        console.log("✅ [handleAssignOfficer] Server returned persistent assignment:", realAss);
        setAssignments((prev) => prev.map((a) => (a.id === tempAssignment.id ? realAss : a)));
      } else {
        console.warn("⚠️ [handleAssignOfficer] Could not acquire access token — assignment saved only in memory");
      }
    } catch (err) {
      console.error("💥 [handleAssignOfficer] Failed to persist assignment to server:", err);
    }
  };



  // Dynamically sort roads based on current/prediction sub-tab selection
  const sortedDssRoads = useMemo(() => {
    const data = [...dssRoadsData];
    if (dssSubTab === "current") {
      return data.sort((a, b) => b.curPriorityScore - a.curPriorityScore);
    } else {
      return data.sort((a, b) => b.predPriorityScore - a.predPriorityScore);
    }
  }, [dssRoadsData, dssSubTab]);

  // Use either backend cases or mockCases
  const allCases = useMemo(() => {
    return cases.length > 0 ? cases : mockCases;
  }, [cases]);

  // 1. Cases filter: cases from past 7 days based on the latest case date in the dataset
  const past7DaysCases = useMemo(() => {
    if (allCases.length === 0) return [];
    
    // Find the latest case date to use as reference
    const dates = allCases.map(c => new Date(c.created_at).getTime());
    const latestTime = Math.max(...dates);
    const sevenDaysAgo = latestTime - 7 * 24 * 60 * 60 * 1000;

    return allCases.filter(c => new Date(c.created_at).getTime() >= sevenDaysAgo);
  }, [allCases]);

  // 2. Mock Officers list around Durg-Bhilai region [21.2050, 81.3100]
  const mockOfficers = useMemo<Officer[]>(() => [
    {
      id: "off-1",
      name: "Suresh Patel",
      badge: "TR-942",
      status: "Active",
      speed: 0,
      vehicle: "CG-07-Patrol-A",
      coords: [21.1948, 81.3394], // Bhilai Sector 6
      phone: "+91 98765 43210",
      lastReport: "Congestion cleared at Sector 6 market."
    },
    {
      id: "off-2",
      name: "Asha Rao",
      badge: "TR-108",
      status: "Patrol",
      speed: 45,
      vehicle: "CG-07-Patrol-B",
      coords: [21.2146, 81.2773], // Durg Bypass
      phone: "+91 98765 43211",
      lastReport: "Setting up speed trap on Bypass."
    },
    {
      id: "off-3",
      name: "Tarun Shukla",
      badge: "TR-382",
      status: "Incident",
      speed: 12,
      vehicle: "CG-07-Patrol-C",
      coords: [21.2090, 81.3520], // Power House Chowk
      phone: "+91 98765 43212",
      lastReport: "Assisting at collision spot."
    },
    {
      id: "off-4",
      name: "Rahul Singh",
      badge: "TR-551",
      status: "Break",
      speed: 0,
      vehicle: "CG-07-Patrol-D",
      coords: [21.2280, 81.3210], // Nehru Nagar
      phone: "+91 98765 43213",
      lastReport: "Completed morning patrol shift."
    },
    {
      id: "off-5",
      name: "Kiran Desai",
      badge: "TR-704",
      status: "Patrol",
      speed: 38,
      coords: [21.2010, 81.3150], // Bhilai Sector 10
      vehicle: "CG-07-Patrol-E",
      phone: "+91 98765 43214",
      lastReport: "Regular security checks at Sector 10."
    }
  ], []);

  // 3. Combine live or mock officers
  const activeOfficers = useMemo<ActiveOfficer[]>(() => {
    if (liveOfficers.length > 0) {
      // Build a userId → name lookup from already-fetched cases (no extra API call)
      const nameFromCases: Record<string, string> = {};
      for (const c of cases) {
        if (c.user_id && c.user_name && !nameFromCases[c.user_id]) {
          nameFromCases[c.user_id] = c.user_name;
        }
      }

      return liveOfficers.map(lo => {
        const resolvedName =
          (lo.user_name && lo.user_name.trim() !== "" && lo.user_name.toLowerCase() !== "unknown officer")
            ? lo.user_name
            : (nameFromCases[lo.user_id] ?? `Officer ${lo.user_id.slice(0, 6)}`);
        return {
          id: lo.user_id,
          name: resolvedName,
          coords: [lo.latitude, lo.longitude],
          recordedAt: lo.recorded_at,
        };
      });
    }
    
    return mockOfficers.map(mo => ({
      id: mo.id,
      name: mo.name,
      coords: mo.coords,
      recordedAt: new Date().toISOString(),
      badge: mo.badge,
      status: mo.status,
      speed: mo.speed,
      vehicle: mo.vehicle,
      phone: mo.phone,
      lastReport: mo.lastReport,
    }));
  }, [liveOfficers, mockOfficers, cases]);

  // 4. Filter active officers whose last GPS ping is within 10 minutes
  // Placed AFTER mockOfficers & activeOfficers to avoid TDZ reference errors
  const recentActiveOfficers = useMemo(() => {
    const tenMinAgo = Date.now() - 10 * 60 * 1000;
    if (liveOfficers.length > 0) {
      const nameFromCases: Record<string, string> = {};
      for (const c of cases) {
        if (c.user_id && c.user_name && !nameFromCases[c.user_id]) {
          nameFromCases[c.user_id] = c.user_name;
        }
      }
      return liveOfficers
        .filter((lo) => {
          const t = new Date(lo.recorded_at).getTime();
          return !isNaN(t) && t >= tenMinAgo;
        })
        .map((lo) => ({
          id: lo.user_id,
          name:
            lo.user_name && lo.user_name.trim() !== "" && lo.user_name.toLowerCase() !== "unknown officer"
              ? lo.user_name
              : (nameFromCases[lo.user_id] ?? `Officer ${lo.user_id.slice(0, 6)}`),
          coords: [lo.latitude, lo.longitude] as [number, number],
          recordedAt: lo.recorded_at,
        }));
    }
    // Fall back to mock officers (all considered "recent" for demo)
    return mockOfficers.map((mo) => ({
      id: mo.id,
      name: mo.name,
      coords: mo.coords,
      recordedAt: new Date().toISOString(),
      badge: mo.badge,
      status: mo.status,
      speed: mo.speed,
      vehicle: mo.vehicle,
      phone: mo.phone,
      lastReport: mo.lastReport,
    }));
  }, [liveOfficers, mockOfficers, cases]);

  // 5. Mock Officer Reports
  const officerReports = useMemo<OfficerReport[]>(() => [
    {
      id: "rep-1",
      officerName: "Suresh Patel",
      timeAgo: "10m ago",
      location: "Bhilai Sector 6",
      coords: [21.1948, 81.3394],
      content: "Heavy congestion resolved near Sector 6 Main Market area. Flow is normal now.",
      severity: "low"
    },
    {
      id: "rep-2",
      officerName: "Tarun Shukla",
      timeAgo: "25m ago",
      location: "Power House Chowk",
      coords: [21.2090, 81.3520],
      content: "Two-wheeler collision reported at Power House Chowk. Traffic diverted to side lanes.",
      severity: "high"
    },
    {
      id: "rep-3",
      officerName: "Asha Rao",
      timeAgo: "1h ago",
      location: "Durg Bypass",
      coords: [21.2146, 81.2773],
      content: "Speed radar set up. 4 over-speeding violation alerts broadcasted to command center.",
      severity: "medium"
    }
  ], []);

  // Initialize map
  useEffect(() => {
    if (!google) return;

    // Check if map already exists
    if (!mapRef.current) {
      const mapElement = document.getElementById("atms-map");
      if (!mapElement) return;

      const map = new google.maps.Map(mapElement, {
        zoom: 13, // Adjusted default zoom level
        center: { lat: 21.2050, lng: 81.3100 },
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }]
      });

      // Initialize and inject the live traffic data stream
      const trafficLayer = new google.maps.TrafficLayer();
      trafficLayer.setMap(map);
      trafficLayerRef.current = trafficLayer;

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current = null;
        trafficLayerRef.current = null;
      }
    };
  }, []);

  // Update POI visibility
  useEffect(() => {
    if (!mapRef.current) return;
    const styles = showPOIs ? [] : [
      {
        featureType: "poi",
        stylers: [{ visibility: "off" }]
      }
    ];
    mapRef.current.setOptions({ styles });
  }, [showPOIs]);

  // Update map markers when filters change
  useEffect(() => {
    if (!mapRef.current || !google) return;

    const map = mapRef.current;
    
    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (mapType === "cases") {
      // Render cases past 7 days
      past7DaysCases.forEach((c) => {
        const severityColors: Record<string, string> = {
          low: "#10b981",
          medium: "#f59e0b",
          high: "#ef4444"
        };
        const color = severityColors[c.severity] || "#3b82f6";

        const popupContent = `
          <div style="font-family: sans-serif; font-size: 12px; color: #1e293b; padding: 4px;">
            <div style="font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
              <span style="background-color: ${color}; width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
              CH${c.id} - ${c.reason}
            </div>
            <div style="line-height: 1.4;">
              <div><strong>Officer:</strong> ${c.user_name}</div>
              <div><strong>Location:</strong> ${c.location}</div>
              <div><strong>Severity:</strong> <span style="text-transform: capitalize; color: ${color}; font-weight: 600;">${c.severity}</span></div>
              <div><strong>Date:</strong> ${new Intl.DateTimeFormat("en-IN", { dateStyle: "short" }).format(new Date(c.created_at))}</div>
            </div>
          </div>
        `;

        const marker = new google.maps.Marker({
          position: { lat: c.latitude, lng: c.longitude },
          map: map,
          title: c.reason,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: color,
            fillOpacity: 1.0,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          }
        });

        const infoWindow = new google.maps.InfoWindow({
          content: popupContent
        });

        marker.addListener("click", () => {
          if (activeInfoWindowRef.current) {
            activeInfoWindowRef.current.close();
          }
          infoWindow.open(map, marker);
          activeInfoWindowRef.current = infoWindow;
        });

        markersRef.current.push(marker);
      });
    } else if (mapType === "location") {
      // Render active officers
      activeOfficers.forEach((o) => {
        const color = o.status ? (
          o.status === "Active" ? "#10b981" :
          o.status === "Patrol" ? "#3b82f6" :
          o.status === "Break" ? "#64748b" : "#ef4444"
        ) : "#3b82f6";

        const formattedTime = new Intl.DateTimeFormat("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date(o.recordedAt));

        let popupContent = `
          <div style="font-family: sans-serif; font-size: 12px; color: #1e293b; padding: 4px; min-width: 180px;">
            <div style="font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
              <span>Officer ${o.name}</span>
              ${o.status ? `<span style="background-color: ${color}; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">${o.status}</span>` : ""}
            </div>
            <div style="line-height: 1.4;">
              <div><strong>ID:</strong> <span style="font-family: monospace;">${o.id.substring(0, 8)}...</span></div>
              <div><strong>Last Active:</strong> ${formattedTime}</div>
              <div><strong>Coords:</strong> ${o.coords[0].toFixed(4)}, ${o.coords[1].toFixed(4)}</div>
        `;

        if (o.vehicle) {
          popupContent += `
              <div><strong>Vehicle:</strong> ${o.vehicle}</div>
              <div><strong>Speed:</strong> ${o.speed} km/h</div>
              <div><strong>Last Report:</strong> "${o.lastReport}"</div>
          `;
        }

        popupContent += `
            </div>
          </div>
        `;

        const marker = new google.maps.Marker({
          position: { lat: o.coords[0], lng: o.coords[1] },
          map: map,
          title: o.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: color,
            fillOpacity: 1.0,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
          label: {
            text: "P",
            color: "#ffffff",
            fontSize: "9px",
            fontWeight: "bold"
          }
        });

        const infoWindow = new google.maps.InfoWindow({
          content: popupContent
        });

        marker.addListener("click", () => {
          if (activeInfoWindowRef.current) {
            activeInfoWindowRef.current.close();
          }
          infoWindow.open(map, marker);
          activeInfoWindowRef.current = infoWindow;
        });

        markersRef.current.push(marker);

        if (selectedOfficerId === o.id) {
          map.panTo({ lat: o.coords[0], lng: o.coords[1] });
          if (activeInfoWindowRef.current) {
            activeInfoWindowRef.current.close();
          }
          infoWindow.open(map, marker);
          activeInfoWindowRef.current = infoWindow;
        }
      });

      // Render reports as alerts (only in mock mode)
      if (!isLiveData) {
        officerReports.forEach((r) => {
          const severityColors: Record<string, string> = {
            low: "#10b981",
            medium: "#f59e0b",
            high: "#ef4444"
          };
          const color = severityColors[r.severity] || "#ef4444";

          const popupContent = `
            <div style="font-family: sans-serif; font-size: 12px; color: #1e293b; padding: 4px; min-width: 180px;">
              <div style="font-weight: bold; color: #ef4444; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 4px;">
                <span>Incident Report (${r.timeAgo})</span>
              </div>
              <div style="line-height: 1.4;">
                <div><strong>By:</strong> Officer ${r.officerName}</div>
                <div><strong>Location:</strong> ${r.location}</div>
                <div style="margin-top: 4px; background-color: #f8fafc; padding: 6px; border-radius: 4px; font-style: italic; border-left: 3px solid ${color};">"${r.content}"</div>
              </div>
            </div>
          `;

          const alertIcon = {
            path: "M12 2L2 22h20L12 2zm1 14h-2v-2h2v2zm0-4h-2V8h2v4z",
            fillColor: color,
            fillOpacity: 1.0,
            scale: 0.9,
            strokeColor: "#ffffff",
            strokeWeight: 1.5,
            anchor: new google.maps.Point(12, 12)
          };

          const marker = new google.maps.Marker({
            position: { lat: r.coords[0], lng: r.coords[1] },
            map: map,
            icon: alertIcon,
            title: `Alert: ${r.location}`
          });

          const infoWindow = new google.maps.InfoWindow({
            content: popupContent
          });

          marker.addListener("click", () => {
            if (activeInfoWindowRef.current) {
              activeInfoWindowRef.current.close();
            }
            infoWindow.open(map, marker);
            activeInfoWindowRef.current = infoWindow;
          });

          markersRef.current.push(marker);
        });
      }
    } else if (mapType === "dss") {
      // Draw officers as small dots for context
      activeOfficers.forEach((o) => {
        const m = new google.maps.Marker({
          position: { lat: o.coords[0], lng: o.coords[1] },
          map,
          title: o.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: "#3b82f6",
            fillOpacity: 0.9,
            strokeColor: "#ffffff",
            strokeWeight: 1.5,
          }
        });
        markersRef.current.push(m);
      });

      // Draw DSS road polylines color-coded by severity
      const SEV_COLOR: Record<string, string> = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#10b981" };
      sortedDssRoads.forEach((item, index) => {
        const origin = { lat: item.road.origin_lat, lng: item.road.origin_lng };
        const dest   = { lat: item.road.destination_lat, lng: item.road.destination_lng };
        const encoded = item.cur?.polyline?.encodedPolyline;
        const path    = encoded ? decodePolyline(encoded) : [origin, dest];
        const segs    = item.cur?.travelAdvisory?.speedReadingIntervals || [];
        const isSelected = selectedRoadId === item.road.id;

        if (isSelected && encoded && segs.length > 1) {
          segs.forEach((seg: any) => {
            const segPath = path.slice(
              seg.startPolylinePointIndex || 0,
              (seg.endPolylinePointIndex || path.length - 1) + 1
            );
            const segColor = seg.speed === "TRAFFIC_JAM" ? "#ef4444" : seg.speed === "SLOW" ? "#f59e0b" : "#10b981";
            const pl = new google.maps.Polyline({ path: segPath, map, geodesic: true, strokeColor: segColor, strokeOpacity: 1.0, strokeWeight: 8 });
            markersRef.current.push(pl);
          });
        } else {
          const pl = new google.maps.Polyline({
            path, map, geodesic: true,
            strokeColor: SEV_COLOR[item.curSeverity.label] || "#94a3b8",
            strokeOpacity: isSelected ? 1.0 : 0.55,
            strokeWeight: isSelected ? 7 : 4,
          });
          pl.addListener("click", () => setSelectedRoadId(item.road.id));
          markersRef.current.push(pl);
        }

        const marker = new google.maps.Marker({
          position: origin, map,
          title: item.road.name,
          label: { text: String(index + 1), color: "#ffffff", fontSize: "10px", fontWeight: "bold" },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: isSelected ? 13 : 10,
            fillColor: SEV_COLOR[item.curSeverity.label] || "#94a3b8",
            fillOpacity: 1.0,
            strokeColor: isSelected ? "#1e3a8a" : "#ffffff",
            strokeWeight: isSelected ? 3 : 1.5,
          }
        });
        marker.addListener("click", () => {
          setSelectedRoadId(item.road.id);
          map.panTo(origin);
          map.setZoom(14);
        });
        markersRef.current.push(marker);
      });
    }
  }, [mapType, past7DaysCases, activeOfficers, officerReports, selectedOfficerId, isLiveData, sortedDssRoads, selectedRoadId]);

  const handleOfficerClick = (o: ActiveOfficer) => {
    setSelectedOfficerId(o.id);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: o.coords[0], lng: o.coords[1] });
      mapRef.current.setZoom(14);
    }
  };

  const handleReportClick = (r: OfficerReport) => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat: r.coords[0], lng: r.coords[1] });
      mapRef.current.setZoom(15);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] w-full gap-6 overflow-hidden">
      {/* Map view taking full space */}
      <div className="relative flex-1 rounded-2xl border border-slate-200 bg-white/60 dark:border-indigo-500/10 dark:bg-[#0A1222]/60 backdrop-blur-md overflow-hidden shadow-xl flex flex-col">
        {/* Filter overlay */}
        <div className="absolute top-4 left-4 z-[1000] flex gap-2 rounded-2xl bg-white/80 dark:bg-[#0A1222]/80 backdrop-blur-md p-1.5 border border-slate-200 dark:border-indigo-500/10 shadow-lg">
          <button
            onClick={() => {
              setMapType("location");
              setSelectedOfficerId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              mapType === "location"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Live Officers & Reports
          </button>
          <button
            onClick={() => {
              setMapType("cases");
              setSelectedOfficerId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              mapType === "cases"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Cases (Past 7 Days)
          </button>
          <button
            onClick={() => {
              setMapType("dss");
              setSelectedOfficerId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              mapType === "dss"
                ? "bg-orange-500 text-white shadow"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Decision Support
          </button>
          <button
            onClick={() => {
              setMapType("allocation");
              setSelectedOfficerId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              mapType === "allocation"
                ? "bg-violet-600 text-white shadow"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Officer Allocation
          </button>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 self-center" />
          <button
            onClick={() => setShowPOIs(!showPOIs)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              showPOIs
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            title={showPOIs ? "Hide Map Details" : "Show Map Details"}
          >
            {showPOIs ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {showPOIs ? "Hide POIs" : "Show POIs"}
          </button>
        </div>

        <div id="atms-map" className="w-full h-full z-10" />
      </div>

      {/* Control panel & list sidebar */}
      <div className="w-96 shrink-0 flex flex-col gap-6 h-full overflow-y-auto">
        {/* Overview Stats — hidden on Officer Allocation tab */}
        {mapType !== "allocation" && (
          <div className="bg-white/60 dark:bg-[#0A1222]/60 border border-slate-200 dark:border-indigo-500/10 rounded-2xl p-5 shadow-lg backdrop-blur-md">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">ATMS Status Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-[#111C30] p-4 rounded-xl border border-slate-200 dark:border-indigo-500/5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase block">Active Patrols</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 block">
                  {isLiveData ? liveOfficers.length : mockOfficers.filter(o => o.status === "Active" || o.status === "Patrol").length}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-[#111C30] p-4 rounded-xl border border-slate-200 dark:border-indigo-500/5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase block">Recent Cases</span>
                <span className="text-2xl font-bold text-amber-500 mt-1 block">{past7DaysCases.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic lists depending on map view */}
        <div className="flex-1 flex flex-col min-h-0 bg-white/60 dark:bg-[#0A1222]/60 border border-slate-200 dark:border-indigo-500/10 rounded-2xl p-5 shadow-lg backdrop-blur-md">
          {mapType === "location" ? (
            <div className="flex flex-col h-full min-h-0">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Active Field Officers</h3>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {activeOfficers.map((o) => {
                  const statusColors: Record<string, string> = {
                    Active: "bg-emerald-500",
                    Patrol: "bg-blue-500",
                    Break: "bg-slate-500",
                    Incident: "bg-red-500"
                  };
                  const colorClass = o.status ? (statusColors[o.status] || "bg-blue-500") : "bg-blue-500";
                  const formattedTime = new Intl.DateTimeFormat("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(o.recordedAt));

                  return (
                    <div
                      key={o.id}
                      onClick={() => handleOfficerClick(o)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                        selectedOfficerId === o.id
                          ? "bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30"
                          : "bg-slate-50/50 hover:bg-slate-50 border-transparent dark:bg-[#111C30]/50 dark:hover:bg-[#111C30]"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${colorClass}`}></div>
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{o.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {o.badge ? `#${o.badge}` : `#${o.id.substring(0, 6)}`}
                        </span>
                      </div>
                      
                      {o.vehicle ? (
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <div>Vehicle: <span className="font-semibold text-slate-700 dark:text-slate-300">{o.vehicle}</span></div>
                          <div>Speed: <span className="font-semibold text-slate-700 dark:text-slate-300">{o.speed} km/h</span></div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Coords: <span className="font-mono">{o.coords[0].toFixed(4)}, {o.coords[1].toFixed(4)}</span>
                        </div>
                      )}

                      <div className="text-xs italic text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-indigo-500/10 pt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {o.lastReport ? `"${o.lastReport}"` : `GPS Ping: ${formattedTime}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Incidents feed inside location view */}
              {!isLiveData && (
                <>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-6 mb-3">Live Officer Reports</h3>
                  <div className="h-44 overflow-y-auto space-y-2 pr-1 border-t border-slate-200 dark:border-indigo-500/10 pt-3">
                    {officerReports.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => handleReportClick(r)}
                        className="p-2.5 rounded-lg bg-red-500/5 hover:bg-red-500/10 border border-red-500/15 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-center text-[10px] mb-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Officer {r.officerName}</span>
                          <span className="text-slate-400">{r.timeAgo}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">"{r.content}"</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : mapType === "cases" ? (
            <div className="flex flex-col h-full min-h-0">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Past 7 Days Cases</h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {past7DaysCases.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 dark:text-slate-500 py-10">No cases logged in the past 7 days.</div>
                ) : (
                  past7DaysCases.map((c) => (
                    <div key={c.id}
                      onClick={() => { if (mapRef.current) { mapRef.current.panTo({ lat: c.latitude, lng: c.longitude }); mapRef.current.setZoom(15); }}}
                      className="p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-transparent hover:border-slate-200 dark:bg-[#111C30]/50 dark:hover:bg-[#111C30] cursor-pointer transition-all flex flex-col gap-1.5">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{c.reason}</span>
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono">CH{c.id}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>By Officer: {c.user_name}</span>
                        <span>{new Intl.DateTimeFormat("en-IN", { dateStyle: "short" }).format(new Date(c.created_at))}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : mapType === "allocation" ? (
            /* ── Officer Allocation Panel ── */
            <div className="flex flex-col h-full min-h-0">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 shrink-0">Officer Allocation</h3>

              {/* ── Rejection Alerts Banner (Dismissible) ── */}
              {activeRejections.length > 0 && (
                <div className="space-y-2 mb-3 shrink-0">
                  {activeRejections.map((rej) => (
                    <div
                      key={rej.id}
                      className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-start justify-between gap-2 shadow-sm animate-fadeIn"
                    >
                      <div className="flex gap-2 min-w-0">
                        <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="font-bold text-red-800 dark:text-red-200">Assignment Rejected</div>
                          <div className="text-[11px] leading-tight text-red-600 dark:text-red-300 mt-0.5">
                            Officer <strong>{rej.officer_name}</strong> rejected <strong>{rej.road_name}</strong>.
                            {rej.rejection_reason && <div className="italic mt-0.5">"{rej.rejection_reason}"</div>}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setDismissedRejections((prev) => [...prev, rej.id])}
                        className="text-red-400 hover:text-red-600 dark:hover:text-red-200 p-1 rounded-lg hover:bg-red-500/10 shrink-0 transition-colors"
                        title="Dismiss alert"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Loading state if DSS not yet loaded */}
              {isDssLoading && sortedDssRoads.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-violet-500" />
                  <span className="text-xs">Loading traffic data for allocation…</span>
                </div>
              ) : sortedDssRoads.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <UserCheck className="w-8 h-8 opacity-30" />
                  <span className="text-xs text-center">No traffic data yet.<br/>Switch to Decision Support tab to load roads.</span>
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">

                  {/* ── Active Officers card ── */}
                  <div className="bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl p-3 shrink-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                        <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">Active Officers (Last 10 min)</span>
                        <span className="text-[10px] font-bold bg-violet-600 text-white px-1.5 py-0.5 rounded-full">{recentActiveOfficers.length}</span>
                      </div>
                      <button
                        onClick={() => void handleRefreshAssignments()}
                        disabled={isRefreshingAssignments}
                        className="flex items-center gap-1 text-[10px] font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-200/60 dark:hover:bg-violet-500/20 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-50"
                        title="Refresh assignment statuses from backend"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRefreshingAssignments ? "animate-spin" : ""}`} />
                        Refresh
                      </button>
                    </div>

                    {recentActiveOfficers.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">No officers with recent GPS ping.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                        {recentActiveOfficers.map((o) => {
                          const assigned = assignedMap[o.id];
                          const isAllocatingThisOfficer = selectedOfficerForAllocate === o.id;

                          return (
                            <div key={o.id} className="p-2 rounded-lg bg-white/80 dark:bg-[#0A1222]/80 border border-violet-100 dark:border-violet-900/30 flex flex-col gap-1.5 transition-all">
                              <div className="flex items-center gap-2">
                                {/* Dot is GREEN when officer is available or active */}
                                <div className={`w-2 h-2 rounded-full shrink-0 ${
                                  assigned
                                    ? (assigned.status === "ACTIVE" ? "bg-emerald-500" : assigned.status === "REJECTED" ? "bg-red-500" : "bg-amber-400")
                                    : "bg-emerald-500"
                                }`} />
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate flex-1">{o.name}</span>

                                {assigned ? (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    assigned.status === "ACTIVE" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                                    : assigned.status === "PENDING" ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                                    : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                                  }`}>
                                    {assigned.status === "ACTIVE" ? `✓ ${assigned.road_name}` : assigned.status === "PENDING" ? `⏳ ${assigned.road_name}` : `❌ Rejected`}
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                                      Available
                                    </span>
                                    <button
                                      onClick={() => setSelectedOfficerForAllocate(isAllocatingThisOfficer ? null : o.id)}
                                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full transition-all flex items-center gap-1 shrink-0 ${
                                        isAllocatingThisOfficer
                                          ? "bg-violet-600 text-white"
                                          : "bg-violet-100 hover:bg-violet-200 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300"
                                      }`}
                                    >
                                      <Plus className="w-2.5 h-2.5" />
                                      {isAllocatingThisOfficer ? "Close" : "Allocate"}
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Compact Filter-like UI for Road Selection (No heavy dropdown) */}
                              {isAllocatingThisOfficer && !assigned && (
                                <div className="mt-1 p-2 rounded-lg bg-violet-100/60 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800/40 space-y-1.5 animate-fadeIn">
                                  <div className="text-[9px] font-bold text-violet-800 dark:text-violet-300 uppercase tracking-wider">Select priority road:</div>
                                  <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-0.5">
                                    {sortedDssRoads.map((item, idx) => {
                                      const sevBadge = item.curSeverity.label === "HIGH"
                                        ? "bg-red-500 text-white"
                                        : item.curSeverity.label === "MEDIUM"
                                        ? "bg-amber-500 text-white"
                                        : "bg-emerald-500 text-white";
                                      return (
                                        <button
                                          key={item.road.id}
                                          onClick={() => {
                                            void handleAssignOfficer(item.road, o, item.curSeverity.label);
                                            setSelectedOfficerForAllocate(null);
                                          }}
                                          className="text-[9px] font-medium px-2 py-1 rounded-lg bg-white dark:bg-[#111C30] hover:bg-violet-100 dark:hover:bg-violet-900/40 border border-violet-200 dark:border-violet-700/50 text-slate-800 dark:text-slate-200 flex items-center gap-1 shadow-sm transition-all text-left"
                                        >
                                          <span className={`text-[8px] font-bold px-1 rounded ${sevBadge}`}>#{idx + 1}</span>
                                          <span className="truncate max-w-[120px] font-semibold">{item.road.name}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── Road cards with assign action ── */}
                  <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 pt-1">Roads by Priority</div>
                  {sortedDssRoads.map((item, rank) => {
                    const sevColor = item.curSeverity.label === "HIGH" ? "text-red-600 dark:text-red-400"
                      : item.curSeverity.label === "MEDIUM" ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400";
                    const sevBadge = item.curSeverity.label === "HIGH"
                      ? "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/25"
                      : item.curSeverity.label === "MEDIUM"
                      ? "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/25"
                      : "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25";

                    // Officers already assigned to THIS road
                    const assignedToRoad = assignments.filter(
                      (a) => a.road_id === item.road.id && (a.status === "PENDING" || a.status === "ACTIVE")
                    );

                    // Officers available to assign (not in assignedMap)
                    const availableOfficers = recentActiveOfficers.filter((o) => !assignedMap[o.id]);

                    const isExpanded = selectedRoadForAssign?.id === item.road.id;

                    return (
                      <div key={item.road.id} className="rounded-xl border border-slate-200 dark:border-indigo-500/10 bg-slate-50/60 dark:bg-[#111C30]/60 overflow-hidden">
                        {/* Road header */}
                        <div className="flex items-start gap-2 p-3">
                          <span className="text-[11px] font-bold text-slate-400 shrink-0 mt-0.5">#{rank + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{item.road.name}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${sevBadge}`}>{item.curSeverity.label}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                              <span className={`font-semibold ${sevColor}`}>Score: {item.curPriorityScore}</span>
                              <span>Delay: {item.cur ? (() => { const d = Math.max(0, parseInt(item.cur.duration) - parseInt(item.cur.staticDuration)); return d > 10 ? `+${Math.round(d/60)}m` : "None"; })() : "—"}</span>
                              <span className={item.trend === "worsening" ? "text-red-500" : item.trend === "clearing" ? "text-emerald-500" : "text-amber-500"}>
                                {item.trend === "worsening" ? "▲" : item.trend === "clearing" ? "▼" : "→"} {item.trend}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Assigned officers row */}
                        {assignedToRoad.length > 0 && (
                          <div className="px-3 pb-2 flex flex-wrap gap-1">
                            {assignedToRoad.map((a) => (
                              <span key={a.id} className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                                a.status === "ACTIVE" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                                : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                              }`}>
                                {a.status === "ACTIVE" ? "✓" : "⏳"} {a.officer_name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Assign button / dropdown */}
                        {availableOfficers.length > 0 && (
                          <div className="border-t border-slate-200 dark:border-indigo-500/10">
                            {!isExpanded ? (
                              <button
                                onClick={() => setSelectedRoadForAssign(item.road)}
                                className="w-full px-3 py-2 text-[10px] font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors flex items-center gap-1.5 justify-center"
                              >
                                <UserCheck className="w-3 h-3" />
                                Assign Officer
                              </button>
                            ) : (
                              <div className="p-2 space-y-1 bg-violet-50/50 dark:bg-violet-500/5">
                                <div className="text-[10px] font-semibold text-violet-700 dark:text-violet-300 mb-1 px-1">Select officer to assign:</div>
                                {availableOfficers.map((o) => (
                                  <button
                                    key={o.id}
                                    onClick={() => void handleAssignOfficer(item.road, o, item.curSeverity.label)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-500/15 transition-colors text-left"
                                  >
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                                    <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">{o.name}</span>
                                  </button>
                                ))}
                                <button
                                  onClick={() => setSelectedRoadForAssign(null)}
                                  className="w-full text-center text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-1 py-1"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ── DSS Priority Panel ── */
            <div className="flex flex-col h-full min-h-0">
              {/* Sub-tabs Selection */}
              <div className="flex bg-slate-100 dark:bg-[#111C30] p-1 rounded-xl mb-4 border border-slate-200/50 dark:border-indigo-500/10 shrink-0">
                <button
                  onClick={() => setDssSubTab("current")}
                  className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition-all ${
                    dssSubTab === "current"
                      ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Current Traffic
                </button>
                <button
                  onClick={() => setDssSubTab("predicted")}
                  className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition-all ${
                    dssSubTab === "predicted"
                      ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  30-Min Prediction
                </button>
              </div>

              <div className="flex items-center justify-between mb-3 shrink-0">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {dssSubTab === "current" ? "Current Traffic Ranking" : "Predicted Traffic Ranking"}
                </h3>
                <button
                  onClick={() => void fetchDssData()}
                  disabled={isDssLoading}
                  className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold rounded-lg bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/25 hover:bg-orange-200 dark:hover:bg-orange-500/25 disabled:opacity-50 transition-colors"
                >
                  <ArrowUpRight className="w-3 h-3" />
                  {isDssLoading ? "Fetching…" : "Refresh"}
                </button>
              </div>

              {dssError && (
                <div className="mb-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center gap-2 shrink-0">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{dssError}
                </div>
              )}

              {isDssLoading && sortedDssRoads.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-orange-500" />
                  <span className="text-xs">Querying Google Routes API for 10 roads…</span>
                </div>
              ) : sortedDssRoads.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Activity className="w-8 h-8 opacity-30" />
                  <span className="text-xs">Click Refresh to load live traffic priority data.</span>
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
                  {sortedDssRoads.map((item, rank) => {
                    const isSelected = selectedRoadId === item.road.id;
                    const trendIcon = item.trend === "worsening" ? "▲" : item.trend === "clearing" ? "▼" : "→";
                    const trendColor = item.trend === "worsening" ? "text-red-500" : item.trend === "clearing" ? "text-emerald-500" : "text-amber-500";

                    // Current Tab values
                    const curSev = item.curSeverity.label;
                    const curSevBg = curSev === "HIGH" ? "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/25"
                                  : curSev === "MEDIUM" ? "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/25"
                                  : "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25";
                    const curDelaySec = item.cur ? Math.max(0, parseInt(item.cur.duration) - parseInt(item.cur.staticDuration)) : 0;
                    const curDelayMin = curDelaySec > 10 ? `+${Math.round(curDelaySec / 60)} min` : "None";

                    // Predicted Tab values
                    const predSev = item.predSeverity.label;
                    const predSevBg = predSev === "HIGH" ? "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/25"
                                  : predSev === "MEDIUM" ? "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/25"
                                  : "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25";
                    const predDelaySec = item.pred ? Math.max(0, parseInt(item.pred.duration) - parseInt(item.pred.staticDuration)) : 0;
                    const predDelayMin = predDelaySec > 10 ? `+${Math.round(predDelaySec / 60)} min` : "None";

                    // Context dependent active fields
                    const activeSev = dssSubTab === "current" ? curSev : predSev;
                    const activeSevBg = dssSubTab === "current" ? curSevBg : predSevBg;
                    const activeScore = dssSubTab === "current" ? item.curSeverity.score : item.predSeverity.score;
                    const activePriority = dssSubTab === "current" ? item.curPriorityScore : item.predPriorityScore;

                    const actionBg = activeSev === "HIGH" || (activeSev === "MEDIUM" && item.trend === "worsening")
                      ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                      : activeSev === "MEDIUM" ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
                    const actionText = activeSev === "HIGH" || (activeSev === "MEDIUM" && item.trend === "worsening")
                      ? `🚨 Deploy officer — high congestion${item.trend === "worsening" ? ", worsening" : ""}`
                      : activeSev === "MEDIUM" ? "👁 Monitor — moderate traffic"
                      : "✅ Clear — no action needed";

                    return (
                      <div key={item.road.id}
                        onClick={() => {
                          setSelectedRoadId(item.road.id);
                          if (mapRef.current) { mapRef.current.panTo({ lat: item.road.origin_lat, lng: item.road.origin_lng }); mapRef.current.setZoom(14); }
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-orange-50 dark:bg-orange-500/10 border-orange-300 dark:border-orange-500/30 shadow-sm"
                            : "bg-slate-50/50 dark:bg-[#111C30]/50 border-transparent hover:border-slate-200 dark:hover:border-indigo-500/20"
                        }`}
                      >
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[11px] font-bold text-slate-400 shrink-0">#{rank + 1}</span>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{item.road.name}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${activeSevBg}`}>
                            {activeSev} · {activeScore} (Pri: {activePriority})
                          </span>
                        </div>

                        {/* Metrics row */}
                        {dssSubTab === "current" ? (
                          <div className="grid grid-cols-3 gap-1 mb-2">
                            <div className="bg-white/60 dark:bg-[#0d1929]/60 rounded-lg p-1.5 text-center">
                              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{item.cur ? Math.round(parseInt(item.cur.duration) / 60) + "m" : "—"}</div>
                              <div className="text-[9px] text-slate-400 uppercase">Live</div>
                            </div>
                            <div className="bg-white/60 dark:bg-[#0d1929]/60 rounded-lg p-1.5 text-center">
                              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{item.cur ? Math.round(parseInt(item.cur.staticDuration) / 60) + "m" : "—"}</div>
                              <div className="text-[9px] text-slate-400 uppercase">Free flow</div>
                            </div>
                            <div className="bg-white/60 dark:bg-[#0d1929]/60 rounded-lg p-1.5 text-center">
                              <div className={`text-xs font-semibold ${curDelaySec > 10 ? "text-red-500" : "text-emerald-500"}`}>{curDelayMin}</div>
                              <div className="text-[9px] text-slate-400 uppercase">Delay</div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-1 mb-2">
                            <div className="bg-white/60 dark:bg-[#0d1929]/60 rounded-lg p-1.5 text-center">
                              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{item.pred ? Math.round(parseInt(item.pred.duration) / 60) + "m" : "—"}</div>
                              <div className="text-[9px] text-slate-400 uppercase">Predicted</div>
                            </div>
                            <div className="bg-white/60 dark:bg-[#0d1929]/60 rounded-lg p-1.5 text-center">
                              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{item.pred ? Math.round(parseInt(item.pred.staticDuration) / 60) + "m" : "—"}</div>
                              <div className="text-[9px] text-slate-400 uppercase">Free flow</div>
                            </div>
                            <div className="bg-white/60 dark:bg-[#0d1929]/60 rounded-lg p-1.5 text-center">
                              <div className={`text-xs font-semibold ${predDelaySec > 10 ? "text-red-500" : "text-emerald-500"}`}>{predDelayMin}</div>
                              <div className="text-[9px] text-slate-400 uppercase">Pred Delay</div>
                            </div>
                          </div>
                        )}

                        {/* Trend row */}
                        <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 px-1 mb-2">
                          <span>Trend delta: <b className={trendColor}>{trendIcon} {item.trend}</b></span>
                          <span className="text-[9px] text-slate-400">Weight: {item.road.priority_weight}x</span>
                        </div>

                        {/* Action banner */}
                        <div className={`text-[10px] font-medium px-2 py-1 rounded-lg ${actionBg}`}>{actionText}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
