import { motion } from "motion/react";
import { recentActivity } from "../mockData";
import { ShieldAlert, IndianRupee, MessageSquare, AlertTriangle } from "lucide-react";

export function LiveFeed() {
  const getIcon = (type: string) => {
    switch(type) {
      case 'challan': return <ShieldAlert className="w-4 h-4 text-blue-400" />;
      case 'payment': return <IndianRupee className="w-4 h-4 text-emerald-400" />;
      case 'query': return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case 'alert': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default: return <MessageSquare className="w-4 h-4 text-slate-400" />;
    }
  };

  const getBg = (type: string) => {
    switch(type) {
      case 'challan': return "bg-blue-500/10 border-blue-500/20";
      case 'payment': return "bg-emerald-500/10 border-emerald-500/20";
      case 'query': return "bg-purple-500/10 border-purple-500/20";
      case 'alert': return "bg-amber-500/10 border-amber-500/20";
      default: return "bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <div className="bg-white/60 dark:bg-[#0A1222]/60 backdrop-blur-md rounded-2xl p-5 border border-slate-200 dark:border-indigo-500/10 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Live Officer Feed
        </h3>
        <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors">View All</button>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {recentActivity.map((act, i) => (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            key={act.id} 
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-[#111C30] transition-colors group cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-indigo-500/10"
          >
            <div className={`mt-0.5 p-2 rounded-lg border ${getBg(act.type)}`}>
              {getIcon(act.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{act.officer}</p>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">{act.time}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{act.action}</p>
              <p className="text-[11px] text-slate-500 mt-1 truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">{act.details}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
