import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useMsal } from "@azure/msal-react";
import { MapWidget } from "../components/MapWidget";
import { LiveFeed } from "../components/LiveFeed";
import { AiInsights } from "../components/AiInsights";
import { Shield, Users, Activity } from "lucide-react";
import { backendScopes, fetchBackendCasesOnce, type BackendCase } from "../services/backendCases";
import { acquireBackendAccessToken } from "../services/authToken";

export function Dashboard() {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  const [cases, setCases] = useState<BackendCase[]>([]);
  const [loadError, setLoadError] = useState("");
  const [trendViolation, setTrendViolation] = useState("All violations");
  const [trendOfficer, setTrendOfficer] = useState("All officers");
  const [pieOfficer, setPieOfficer] = useState("All officers");
  const [pieWindow, setPieWindow] = useState("Last 30 days");

  useEffect(() => {
    const loadCases = async () => {
      try {
        const accessToken = await acquireBackendAccessToken(instance, accounts, backendScopes);
        if (!accessToken) return;
        const data = await fetchBackendCasesOnce(accessToken);
        setCases(data);
        setLoadError("");
      } catch {
        setCases([]);
        setLoadError("Unable to load dashboard data. Please sign in again.");
      }
    };
    void loadCases();
  }, [accounts, instance]);

  const violationOptions = useMemo(
    () => ["All violations", ...Array.from(new Set(cases.map((item) => item.reason))).sort()],
    [cases],
  );
  const officerOptions = useMemo(
    () => ["All officers", ...Array.from(new Set(cases.map((item) => item.user_name))).sort()],
    [cases],
  );
  const pieWindowOptions = ["Last 7 days", "Last 30 days", "All time"];
  const piePalette = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#ef4444"];

  const weeklyTrendData = useMemo(() => {
    const latestCaseDate = [...cases]
      .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
      .at(-1)?.created_at;

    const endDate = latestCaseDate ? new Date(latestCaseDate) : new Date();
    endDate.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, index) => {
      const current = new Date(endDate);
      current.setDate(endDate.getDate() - (6 - index));
      const isoDate = current.toISOString().slice(0, 10);

      const dayCases = cases.filter((item) => {
        const itemDate = new Date(item.created_at).toISOString().slice(0, 10);
        const matchesDate = itemDate === isoDate;
        const matchesViolation =
          trendViolation === "All violations" || item.reason === trendViolation;
        const matchesOfficer =
          trendOfficer === "All officers" || item.user_name === trendOfficer;

        return matchesDate && matchesViolation && matchesOfficer;
      });

      return {
        day: current.toLocaleDateString("en-IN", { weekday: "short" }),
        date: isoDate,
        cases: dayCases.length,
      };
    });
  }, [cases, trendOfficer, trendViolation]);

  const pieData = useMemo(() => {
    const latestDate = [...cases]
      .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
      .at(-1)?.created_at;

    const latest = latestDate ? new Date(latestDate) : new Date();
    latest.setHours(23, 59, 59, 999);

    const windowDays =
      pieWindow === "Last 7 days" ? 7 : pieWindow === "Last 30 days" ? 30 : Number.POSITIVE_INFINITY;
    const start = new Date(latest);
    if (Number.isFinite(windowDays)) {
      start.setDate(latest.getDate() - (windowDays - 1));
      start.setHours(0, 0, 0, 0);
    }

    const filtered = cases.filter((item) => {
      const itemDate = new Date(item.created_at);
      const matchesOfficer = pieOfficer === "All officers" || item.user_name === pieOfficer;
      const matchesWindow = !Number.isFinite(windowDays) || itemDate >= start;
      return matchesOfficer && matchesWindow;
    });

    const grouped = filtered.reduce<Record<string, number>>((acc, item) => {
      acc[item.reason] = (acc[item.reason] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value], index) => ({
        name,
        value,
        color: piePalette[index % piePalette.length],
      }))
      .sort((left, right) => right.value - left.value);
  }, [cases, pieOfficer, pieWindow]);

  const totalPieCases = useMemo(
    () => pieData.reduce((sum, item) => sum + item.value, 0),
    [pieData],
  );

  const handleTrendClick = (event: { activePayload?: Array<{ payload?: { date?: string } }> }) => {
    const clickedDate = event.activePayload?.[0]?.payload?.date;
    if (!clickedDate) return;

    const params = new URLSearchParams();
    params.set("date", clickedDate);
    if (trendOfficer !== "All officers") {
      params.set("officer", trendOfficer);
    }
    if (trendViolation !== "All violations") {
      params.set("violation", trendViolation);
    }
    navigate(`/cases?${params.toString()}`);
  };

  const handlePieClick = (data: { name?: string }) => {
    if (!data?.name) return;

    const params = new URLSearchParams();
    params.set("violation", data.name);
    if (pieOfficer !== "All officers") {
      params.set("officer", pieOfficer);
    }
    navigate(`/cases?${params.toString()}`);
  };

  const todaysCases = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return cases.filter((item) => new Date(item.created_at).toISOString().slice(0, 10) === today).length;
  }, [cases]);

  const activeOfficers = useMemo(
    () => new Set(cases.map((item) => item.user_name)).size,
    [cases],
  );

  return (
    <div className="space-y-6 pb-10">
      {loadError ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          {loadError}
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Today's Cases"
          value={String(todaysCases)}
          trend="Live"
          trendUp={true}
          icon={<Shield className="w-5 h-5 text-blue-400" />}
          color="from-blue-600/20 to-indigo-600/5"
          borderColor="border-blue-500/20"
          onClick={() => navigate("/cases")}
        />
        <KpiCard
          title="Total Cases"
          value={String(cases.length)}
          trend="Live"
          trendUp={true}
          icon={<Activity className="w-5 h-5 text-amber-400" />}
          color="from-amber-600/20 to-orange-600/5"
          borderColor="border-amber-500/20"
          onClick={() => navigate("/cases")}
        />
        <KpiCard
          title="Active Officers"
          value={String(activeOfficers)}
          trend="Live"
          trendUp={true}
          icon={<Users className="w-5 h-5 text-purple-400" />}
          color="from-purple-600/20 to-pink-600/5"
          borderColor="border-purple-500/20"
          onClick={() => navigate("/cases")}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 h-[450px] lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white/60 dark:bg-[#0A1222]/60 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-indigo-500/10 shadow-lg flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-indigo-500/10 flex justify-between items-center bg-slate-50/40 dark:bg-[#050B14]/40">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Geographic Hotspots</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Chhattisgarh Central Zones</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs rounded-lg border border-blue-200 dark:border-blue-500/30">Traffic</button>
              <button className="px-3 py-1.5 bg-slate-100 dark:bg-[#111C30] text-slate-600 dark:text-slate-400 text-xs rounded-lg hover:text-slate-900 dark:hover:text-slate-200 transition-colors">Patrols</button>
            </div>
          </div>
          <div className="flex-1 p-4">
            <MapWidget cases={cases} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <LiveFeed cases={cases} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-[350px]">
        <div className="lg:col-span-1 bg-white/60 dark:bg-[#0A1222]/60 backdrop-blur-md rounded-2xl p-5 border border-slate-200 dark:border-indigo-500/10 shadow-lg flex flex-col min-h-[300px]">
          <div className="mb-4 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider">7-Day Case Volume</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                value={trendViolation}
                onChange={(event) => setTrendViolation(event.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-[#111C30] dark:text-slate-200"
              >
                {violationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={trendOfficer}
                onChange={(event) => setTrendOfficer(event.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-[#111C30] dark:text-slate-200"
              >
                {officerOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyTrendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={handleTrendClick}
              >
                <defs>
                  <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} className="dark:stroke-[#1e293b]" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--color-bg, #ffffff)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "12px", color: "var(--color-text, #1e293b)" }}
                  itemStyle={{ color: "#3b82f6" }}
                />
                <Area
                  type="monotone"
                  dataKey="cases"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCases)"
                  activeDot={{ r: 6, style: { cursor: "pointer" } }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white/60 dark:bg-[#0A1222]/60 backdrop-blur-md rounded-2xl p-5 border border-slate-200 dark:border-indigo-500/10 shadow-lg flex flex-col min-h-[300px]">
          <div className="mb-4 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Violation Breakdown</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                value={pieWindow}
                onChange={(event) => setPieWindow(event.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-[#111C30] dark:text-slate-200"
              >
                {pieWindowOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={pieOfficer}
                onChange={(event) => setPieOfficer(event.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-[#111C30] dark:text-slate-200"
              >
                {officerOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  onClick={handlePieClick}
                  style={{ cursor: "pointer" }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--color-bg, #ffffff)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "12px", color: "var(--color-text, #1e293b)" }}
                  itemStyle={{ color: "#3b82f6" }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalPieCases}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Total Cases</span>
            </div>

            <div className="absolute bottom-0 flex flex-wrap justify-center gap-2 mt-2 w-full px-2">
              {pieData.slice(0, 3).map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center text-[10px] text-slate-600 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <AiInsights />
        </div>
      </div>
    </div>
  );
}

type KpiCardProps = {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  onClick?: () => void;
};

function KpiCard({ title, value, trend, trendUp, icon, color, borderColor, onClick }: KpiCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={onClick}
      className={`bg-gradient-to-br ${color} bg-white/80 dark:bg-[#0A1222]/80 backdrop-blur-xl rounded-2xl p-5 border border-slate-200 dark:${borderColor} shadow-lg relative overflow-hidden group ${onClick ? "cursor-pointer" : ""}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#050B14]/50 border border-slate-200 dark:border-slate-700/50 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"}`}>
          {trend}
        </div>
      </div>
      <div>
        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{value}</p>
        {onClick ? (
          <p className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">Open challan management</p>
        ) : null}
      </div>
    </motion.div>
  );
}
