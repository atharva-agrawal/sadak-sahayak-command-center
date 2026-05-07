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
import { useNavigate } from "react-router";
import {
  weeklyChallansData,
  violationDistributionData,
} from "../mockData";
import { MapWidget } from "../components/MapWidget";
import { LiveFeed } from "../components/LiveFeed";
import { AiInsights } from "../components/AiInsights";
import { Shield, Users, IndianRupee, Activity } from "lucide-react";

export function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-10">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Today's Cases" 
          value="1,245" 
          trend="+12%" 
          trendUp={true} 
          icon={<Shield className="w-5 h-5 text-blue-400" />} 
          color="from-blue-600/20 to-indigo-600/5"
          borderColor="border-blue-500/20"
          onClick={() => navigate("/cases")}
        />
        <KpiCard 
          title="Pending Actions" 
          value="342" 
          trend="-5%" 
          trendUp={false} 
          icon={<Activity className="w-5 h-5 text-amber-400" />} 
          color="from-amber-600/20 to-orange-600/5"
          borderColor="border-amber-500/20"
          onClick={() => navigate("/cases")}
        />
        <KpiCard 
          title="Daily Revenue" 
          value="₹2.1L" 
          trend="+8%" 
          trendUp={true} 
          icon={<IndianRupee className="w-5 h-5 text-emerald-400" />} 
          color="from-emerald-600/20 to-teal-600/5"
          borderColor="border-emerald-500/20"
        />
        <KpiCard 
          title="Active Officers" 
          value="89" 
          trend="Stable" 
          trendUp={true} 
          icon={<Users className="w-5 h-5 text-purple-400" />} 
          color="from-purple-600/20 to-pink-600/5"
          borderColor="border-purple-500/20"
          onClick={() => navigate("/cases")}
        />
      </div>

      {/* Map & Live Feed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[450px]">
        {/* State Map (Chhattisgarh abstraction) */}
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
            <MapWidget />
          </div>
        </div>

        {/* Live Feed */}
        <div className="lg:col-span-1">
          <LiveFeed />
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-[350px]">
        {/* Trend Area Chart */}
        <div className="lg:col-span-1 bg-white/60 dark:bg-[#0A1222]/60 backdrop-blur-md rounded-2xl p-5 border border-slate-200 dark:border-indigo-500/10 shadow-lg flex flex-col min-h-[300px]">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">7-Day Case Volume</h3>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyChallansData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} className="dark:stroke-[#1e293b]" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--color-bg, #ffffff)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "12px", color: "var(--color-text, #1e293b)" }}
                  itemStyle={{ color: "#3b82f6" }}
                />
                <Area type="monotone" dataKey="cases" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCases)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Violation Distribution Donut */}
        <div className="lg:col-span-1 bg-white/60 dark:bg-[#0A1222]/60 backdrop-blur-md rounded-2xl p-5 border border-slate-200 dark:border-indigo-500/10 shadow-lg flex flex-col min-h-[300px]">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2">Violation Breakdown</h3>
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={violationDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {violationDistributionData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--color-bg, #ffffff)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "12px", color: "var(--color-text, #1e293b)" }}
                  itemStyle={{ color: "#3b82f6" }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">1.2k</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Total Cases</span>
            </div>
            
            {/* Compact Legend */}
            <div className="absolute bottom-0 flex flex-wrap justify-center gap-2 mt-2 w-full px-2">
              {violationDistributionData.slice(0, 3).map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center text-[10px] text-slate-600 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }}></div>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights */}
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
      onKeyDown={onClick ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#050B14]/50 border border-slate-200 dark:border-slate-700/50 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
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
