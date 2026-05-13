import { BrainCircuit, TrendingUp, AlertOctagon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { generateAiInsights, type AiInsight } from "../services/aiInsights";

export function AiInsights() {
  const [insights, setInsights] = useState<AiInsight[]>([]);

  useEffect(() => {
    let isMounted = true;
    generateAiInsights().then((data) => {
      if (isMounted) setInsights(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-[#0A1222] dark:to-[#111A30] rounded-2xl p-5 border border-slate-200 dark:border-indigo-500/20 shadow-lg relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-600 dark:text-white">
        <BrainCircuit className="w-32 h-32" />
      </div>

      <div className="flex items-center gap-3 mb-5 relative z-10">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg border border-indigo-200 dark:border-indigo-500/30">
          <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Sadak Sahayak AI</h3>
          <p className="text-[10px] text-indigo-600 dark:text-indigo-300">Operational Summaries</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 relative z-10 overflow-auto pr-1">
        {insights.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.12 }}
            className={`p-3 rounded-xl bg-white/80 dark:bg-[#050B14]/50 border shadow-sm dark:shadow-none ${borderClass(item.severity)}`}
          >
            <div className="flex items-start gap-3">
              {item.severity === "high" ? (
                <AlertOctagon className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5" />
              ) : (
                <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5" />
              )}
              <div>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  <span className={`font-semibold ${titleClass(item.severity)}`}>{item.title}:</span>{" "}
                  {item.message}
                </p>
                {item.actionLabel ? (
                  <button className="text-[10px] text-blue-600 dark:text-blue-400 mt-2 hover:underline">
                    {item.actionLabel} {"->"}
                  </button>
                ) : null}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function borderClass(severity: AiInsight["severity"]) {
  if (severity === "high") return "border-red-100 dark:border-slate-700/50";
  if (severity === "low") return "border-blue-100 dark:border-slate-700/50";
  return "border-emerald-100 dark:border-slate-700/50";
}

function titleClass(severity: AiInsight["severity"]) {
  if (severity === "high") return "text-red-600 dark:text-red-400";
  if (severity === "low") return "text-blue-600 dark:text-blue-400";
  return "text-emerald-600 dark:text-emerald-400";
}
