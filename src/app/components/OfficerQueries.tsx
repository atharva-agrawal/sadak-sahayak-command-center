import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { motion } from "motion/react";
import { MessageSquare, Clock, User, AlertCircle } from "lucide-react";
import { acquireBackendAccessToken } from "../services/authToken";
import { fetchOfficerQueryStats, type OfficerQueryStats, backendScopes } from "../services/backendChats";

export function OfficerQueries() {
  const { instance, accounts } = useMsal();
  const [stats, setStats] = useState<OfficerQueryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      try {
        const token = await acquireBackendAccessToken(instance, accounts, backendScopes);
        if (!token) return;
        const data = await fetchOfficerQueryStats(token);
        if (isMounted) {
          setStats(data);
          setError("");
        }
      } catch (err) {
        console.error("Failed to load officer queries:", err);
        if (isMounted) {
          setError("Failed to fetch query logs");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadStats();

    // Refresh every 30 seconds for live updates
    const interval = setInterval(loadStats, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [instance, accounts]);

  if (loading) {
    return (
      <div className="bg-white/60 dark:bg-[#0A1222]/60 backdrop-blur-md rounded-2xl p-5 border border-slate-200 dark:border-indigo-500/10 shadow-lg flex flex-col h-full justify-center items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/60 dark:bg-[#0A1222]/60 backdrop-blur-md rounded-2xl p-5 border border-slate-200 dark:border-indigo-500/10 shadow-lg flex flex-col h-full justify-center items-center text-red-500 gap-2">
        <AlertCircle className="w-5 h-5" />
        <span className="text-xs font-semibold">{error}</span>
      </div>
    );
  }

  return (
    <div className="bg-white/60 dark:bg-[#0A1222]/60 backdrop-blur-md rounded-2xl p-5 border border-slate-200 dark:border-indigo-500/10 shadow-lg flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          Officer Assistant Queries
        </h3>
        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full font-semibold">
          Live Stats
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
        {stats.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
            No queries logged yet.
          </div>
        ) : (
          stats.map((item, index) => {
            const formattedTime = item.last_query_time
              ? new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(new Date(item.last_query_time))
              : "";

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={item.user_id}
                className="p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 dark:bg-[#111C30]/30 dark:hover:bg-[#111C30]/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-indigo-500/10 flex flex-col gap-1.5"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {item.user_name || "Unknown Officer"}
                    </span>
                  </div>
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md font-bold font-mono">
                    {item.total_queries} queries
                  </span>
                </div>

                {item.last_query_text && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium bg-white/40 dark:bg-[#050B14]/30 rounded-lg p-2 border border-slate-100 dark:border-indigo-500/5">
                    <p className="italic text-slate-500 dark:text-slate-500 mb-1">Last Query:</p>
                    <p className="line-clamp-2">"{item.last_query_text}"</p>
                  </div>
                )}

                {formattedTime && (
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 self-end">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Last query at {formattedTime}</span>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
