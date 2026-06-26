import { useEffect, useRef, useState, useMemo } from "react";
import { useMsal } from "@azure/msal-react";
import { Navigation, ShieldAlert, FileText, User, Radio, MapPin, AlertCircle, Clock, Eye } from "lucide-react";
import { mockCases } from "../mockCases";
import { backendScopes, fetchBackendCasesOnce, type BackendCase } from "../services/backendCases";
import { acquireBackendAccessToken } from "../services/authToken";

// Access Leaflet from window
const L = (window as any).L;

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

export function AtmsDashboard() {
  const { instance, accounts } = useMsal();
  const [cases, setCases] = useState<BackendCase[]>([]);
  const [loadError, setLoadError] = useState("");
  const [mapType, setMapType] = useState<"cases" | "location">("location");
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(null);

  // Map references
  const mapRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  // Load cases from backend or fallback to mock
  useEffect(() => {
    const loadCases = async () => {
      try {
        const accessToken = await acquireBackendAccessToken(instance, accounts, backendScopes);
        if (!accessToken) return;
        const data = await fetchBackendCasesOnce(accessToken);
        setCases(data);
      } catch {
        // Safe fallback to mock cases if backend/auth fails
        setCases([]);
      }
    };
    void loadCases();
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

  // 3. Mock Officer Reports
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
    if (!L) return;

    // Check if map already exists
    if (!mapRef.current) {
      const map = L.map("atms-map", {
        zoomControl: false
      }).setView([21.2050, 81.3100], 13); // Durg-Bhilai default center

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      mapRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersGroupRef.current = null;
      }
    };
  }, []);

  // Update map markers when filters change
  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current || !L) return;

    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    if (mapType === "cases") {
      // Render cases past 7 days
      past7DaysCases.forEach((c) => {
        const severityColors: Record<string, string> = {
          low: "#10b981",
          medium: "#f59e0b",
          high: "#ef4444"
        };
        const color = severityColors[c.severity] || "#3b82f6";
        
        const htmlIcon = L.divIcon({
          className: "custom-case-marker",
          html: `<div style="background-color: ${color}; width: 14px; height: 14px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(0,0,0,0.3);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        const popupContent = `
          <div class="p-1 font-sans text-xs text-slate-800 dark:text-slate-200">
            <div class="font-bold border-b pb-1 mb-1 flex items-center gap-1">
              <span class="w-2 h-2 rounded-full" style="background-color: ${color}"></span>
              CH${c.id} - ${c.reason}
            </div>
            <div class="space-y-0.5">
              <div><strong>Officer:</strong> ${c.user_name}</div>
              <div><strong>Location:</strong> ${c.location}</div>
              <div><strong>Severity:</strong> <span class="capitalize" style="color: ${color}">${c.severity}</span></div>
              <div><strong>Date:</strong> ${new Intl.DateTimeFormat("en-IN", { dateStyle: "short" }).format(new Date(c.created_at))}</div>
            </div>
          </div>
        `;

        L.marker([c.latitude, c.longitude], { icon: htmlIcon })
          .bindPopup(popupContent)
          .addTo(markersGroup);
      });
    } else {
      // Render active officers
      mockOfficers.forEach((o) => {
        const statusColors: Record<string, string> = {
          Active: "#10b981",
          Patrol: "#3b82f6",
          Break: "#64748b",
          Incident: "#ef4444"
        };
        const color = statusColors[o.status] || "#3b82f6";

        const htmlIcon = L.divIcon({
          className: "custom-officer-marker",
          html: `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-6 h-6 rounded-full opacity-35 animate-ping" style="background-color: ${color}"></div>
              <div class="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-white" style="background-color: ${color}; box-shadow: 0 0 10px rgba(0,0,0,0.4);">
                <span style="font-size: 8px; font-weight: bold;">P</span>
              </div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const popupContent = `
          <div class="p-2 font-sans text-xs text-slate-800 dark:text-slate-200">
            <div class="font-bold border-b pb-1 mb-1 flex items-center justify-between gap-4">
              <span>Officer ${o.name} (${o.badge})</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white" style="background-color: ${color}">${o.status}</span>
            </div>
            <div class="space-y-0.5 mt-1.5">
              <div><strong>Vehicle:</strong> ${o.vehicle}</div>
              <div><strong>Speed:</strong> ${o.speed} km/h</div>
              <div><strong>Last Report:</strong> "${o.lastReport}"</div>
            </div>
          </div>
        `;

        const marker = L.marker(o.coords, { icon: htmlIcon })
          .bindPopup(popupContent)
          .addTo(markersGroup);

        if (selectedOfficerId === o.id) {
          map.panTo(o.coords);
          marker.openPopup();
        }
      });

      // Render reports as alerts
      officerReports.forEach((r) => {
        const severityColors: Record<string, string> = {
          low: "#10b981",
          medium: "#f59e0b",
          high: "#ef4444"
        };
        const color = severityColors[r.severity];

        const htmlIcon = L.divIcon({
          className: "custom-report-marker",
          html: `
            <div class="w-5 h-5 rounded-full flex items-center justify-center text-white border border-white" style="background-color: ${color}; box-shadow: 0 0 8px ${color};">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-3 h-3"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const popupContent = `
          <div class="p-1.5 font-sans text-xs text-slate-800 dark:text-slate-200">
            <div class="font-bold text-red-500 flex items-center gap-1 border-b pb-1 mb-1">
              <span>Incident Report (${r.timeAgo})</span>
            </div>
            <div><strong>By:</strong> Officer ${r.officerName}</div>
            <div><strong>Location:</strong> ${r.location}</div>
            <div class="mt-1 bg-slate-50 dark:bg-slate-800 p-1.5 rounded italic">"${r.content}"</div>
          </div>
        `;

        L.marker(r.coords, { icon: htmlIcon })
          .bindPopup(popupContent)
          .addTo(markersGroup);
      });
    }
  }, [mapType, past7DaysCases, mockOfficers, officerReports, selectedOfficerId]);

  const handleOfficerClick = (o: Officer) => {
    setSelectedOfficerId(o.id);
    if (mapRef.current) {
      mapRef.current.setView(o.coords, 14);
    }
  };

  const handleReportClick = (r: OfficerReport) => {
    if (mapRef.current) {
      mapRef.current.setView(r.coords, 15);
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
                {mockOfficers.filter(o => o.status === "Active" || o.status === "Patrol").length}
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
                {mockOfficers.map((o) => {
                  const statusColors: Record<string, string> = {
                    Active: "bg-emerald-500",
                    Patrol: "bg-blue-500",
                    Break: "bg-slate-500",
                    Incident: "bg-red-500"
                  };
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
                          <div className={`w-2 h-2 rounded-full ${statusColors[o.status] || "bg-slate-500"}`}></div>
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{o.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">#{o.badge}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <div>Vehicle: <span className="font-semibold text-slate-700 dark:text-slate-300">{o.vehicle}</span></div>
                        <div>Speed: <span className="font-semibold text-slate-700 dark:text-slate-300">{o.speed} km/h</span></div>
                      </div>

                      <div className="text-xs italic text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-indigo-500/10 pt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">"{o.lastReport}"</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Incidents feed inside location view */}
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
                          mapRef.current.setView([c.latitude, c.longitude], 15);
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
