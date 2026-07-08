import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { ShieldAlert } from "lucide-react";
import type { BackendCase } from "../services/backendCases";

export function LiveFeed({ cases }: { cases: BackendCase[] }) {
  const navigate = useNavigate();

  const recent = [...cases]
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 5);

  return (
    <div className="bg-white/60 dark:bg-[#0A1222]/60 backdrop-blur-md rounded-2xl p-5 border border-slate-200 dark:border-indigo-500/10 shadow-lg flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          Live Officer Feed
        </h3>
        <button type="button" onClick={() => navigate("/cases")} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors">
          View All
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-2">
        {recent.map((item, index) => (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-[#111C30] transition-colors border border-transparent hover:border-slate-200 dark:hover:border-indigo-500/10"
          >
            <div className="mt-0.5 p-2 rounded-lg border bg-blue-500/10 border-blue-500/20">
              <ShieldAlert className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/cases?officer=${encodeURIComponent(item.user_name)}`)}
                  className="truncate text-left text-sm font-medium text-slate-800 transition hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-300"
                >
                  {item.user_name}
                </button>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  {new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(new Date(item.created_at))}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{item.reason}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
