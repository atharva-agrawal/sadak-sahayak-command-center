import { MapPin } from "lucide-react";
import { motion } from "motion/react";
import { mapHotspots } from "../mockData";

export function MapWidget() {
  // A stylized abstract geographic representation since we don't have exact accurate SVG bounds.
  // We'll use a glassmorphic container and a custom path that looks somewhat like a state boundary.
  
  return (
    <div className="relative w-full h-full min-h-[300px] flex items-center justify-center bg-slate-50/80 dark:bg-[#050B14]/40 rounded-xl border border-slate-200 dark:border-indigo-500/10 overflow-hidden group">
      {/* Background Grid for techy feel */}
      <div 
        className="absolute inset-0 opacity-[0.05] dark:opacity-[0.15]" 
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #818cf8 1px, transparent 0)', backgroundSize: '24px 24px' }}
      />
      
      {/* Abstract Map Area Wrapper */}
      <div className="relative w-[80%] h-[90%] flex items-center justify-center">
        {/* Abstract State Outline (Vaguely central India/Chhattisgarh shape) */}
        <svg viewBox="0 0 200 300" className="w-full h-full drop-shadow-[0_0_15px_rgba(59,130,246,0.1)] dark:drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <path 
            d="M 90,10 C 110,15 130,40 140,70 C 145,90 160,110 170,140 C 180,180 160,220 140,250 C 120,280 90,290 70,280 C 50,270 30,240 20,200 C 10,160 30,120 40,90 C 50,60 70,30 90,10 Z" 
            fill="rgba(226, 232, 240, 0.6)" 
            stroke="rgba(99, 102, 241, 0.3)" 
            strokeWidth="2"
            className="transition-all duration-1000 group-hover:stroke-[rgba(99,102,241,0.5)] group-hover:fill-[rgba(226,232,240,0.8)] dark:fill-[rgba(30,41,59,0.4)] dark:stroke-[rgba(99,102,241,0.5)] dark:group-hover:stroke-[rgba(99,102,241,0.8)] dark:group-hover:fill-[rgba(30,41,59,0.6)]"
          />
          <path 
            d="M 90,10 C 110,15 130,40 140,70 C 145,90 160,110 170,140" 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="3" 
            strokeDasharray="4 4"
            className="animate-pulse opacity-50"
          />
        </svg>

        {/* Overlay Hotspots */}
        {mapHotspots.map((spot, idx) => {
          // Normalize coordinates somewhat to fit within our arbitrary 200x300 SVG bounding box
          // Latitude ~ 19 to 23 (Lower is bottom)
          // Longitude ~ 81 to 84 (Lower is left)
          const normY = 100 - ((spot.lat - 19) / 4) * 100; // inverted Y
          const normX = ((spot.lng - 81) / 3) * 100;
          
          let colorClass = "bg-emerald-500";
          let glowClass = "shadow-emerald-500/50";
          if (spot.count > 20) { colorClass = "bg-amber-400"; glowClass = "shadow-amber-400/50"; }
          if (spot.count > 35) { colorClass = "bg-red-500"; glowClass = "shadow-red-500/50"; }

          return (
            <motion.div
              key={spot.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.2, type: "spring" }}
              className="absolute group/pin cursor-pointer"
              style={{ top: `${Math.max(10, Math.min(85, normY))}%`, left: `${Math.max(20, Math.min(80, normX))}%` }}
            >
              {/* Pulsing ring */}
              <div className={`absolute -inset-2 rounded-full ${colorClass} opacity-30 animate-ping`} />
              
              {/* Core dot */}
              <div className={`relative w-3 h-3 rounded-full ${colorClass} shadow-[0_0_10px_2px] ${glowClass} border border-white dark:border-[#050B14] z-10`} />
              
              {/* Tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-white/90 dark:bg-[#0A1222]/90 backdrop-blur-md border border-slate-200 dark:border-indigo-500/30 rounded-lg p-2 text-xs w-32 opacity-0 group-hover/pin:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{spot.name}</p>
                <div className="flex items-center justify-between mt-1 text-slate-500 dark:text-slate-400">
                  <span>Violations:</span>
                  <span className={`font-bold ${colorClass.replace('bg-', 'text-')}`}>{spot.count}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="absolute bottom-4 left-4 bg-white/80 dark:bg-[#0A1222]/80 backdrop-blur border border-slate-200 dark:border-indigo-500/20 rounded-lg p-3 shadow-md dark:shadow-none">
        <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
          <MapPin className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Live Zone Status
        </h4>
        <div className="flex flex-col gap-1 text-[10px] text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)] dark:shadow-[0_0_5px_rgba(239,68,68,0.8)]"/> Critical {'>'} 35 cases/hr</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.5)] dark:shadow-[0_0_5px_rgba(250,204,21,0.8)]"/> Elevated</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)] dark:shadow-[0_0_5px_rgba(34,197,94,0.8)]"/> Normal</div>
        </div>
      </div>
    </div>
  );
}
