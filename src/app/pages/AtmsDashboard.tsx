import { useEffect, useRef, useState, useMemo } from "react";
import { useMsal } from "@azure/msal-react";
import { Navigation, ShieldAlert, FileText, User, Radio, MapPin, AlertCircle, Clock, Eye, EyeOff } from "lucide-react";
import { mockCases } from "../mockCases";
import { backendScopes, fetchBackendCasesOnce, type BackendCase } from "../services/backendCases";
import { acquireBackendAccessToken } from "../services/authToken";
import { fetchBackendLocations, type BackendLocation } from "../services/backendLocations";

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

export function AtmsDashboard() {
  const { instance, accounts } = useMsal();
  const [cases, setCases] = useState<BackendCase[]>([]);
  const [liveOfficers, setLiveOfficers] = useState<BackendLocation[]>([]);
  const [loadError, setLoadError] = useState("");
  const [mapType, setMapType] = useState<"cases" | "location">("location");
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(null);
  const [showPOIs, setShowPOIs] = useState(false);
  const isLiveData = liveOfficers.length > 0;

  // Map references
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const trafficLayerRef = useRef<any>(null);
  const activeInfoWindowRef = useRef<any>(null);

  // Load cases and locations from backend or fallback
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
      } catch (err) {
        console.error("Auth token acquisition or fetch failed:", err);
      }
    };
    void loadData();
  }, [accounts, instance]);

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
      return liveOfficers.map(lo => ({
        id: lo.user_id,
        name: lo.user_name ?? "Unknown Officer",
        coords: [lo.latitude, lo.longitude],
        recordedAt: lo.recorded_at,
      }));
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
  }, [liveOfficers, mockOfficers]);

  // 4. Mock Officer Reports
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
    } else {
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
    }
  }, [mapType, past7DaysCases, activeOfficers, officerReports, selectedOfficerId, isLiveData]);

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
        {/* Overview Stats */}
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
          ) : (
            <div className="flex flex-col h-full min-h-0">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Past 7 Days Cases</h3>
              
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {past7DaysCases.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 dark:text-slate-500 py-10">
                    No cases logged in the past 7 days.
                  </div>
                ) : (
                  past7DaysCases.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        if (mapRef.current) {
                          mapRef.current.panTo({ lat: c.latitude, lng: c.longitude });
                          mapRef.current.setZoom(15);
                        }
                      }}
                      className="p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-transparent hover:border-slate-200 dark:bg-[#111C30]/50 dark:hover:bg-[#111C30] cursor-pointer transition-all flex flex-col gap-1.5"
                    >
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
          )}
        </div>
      </div>
    </div>
  );
}
