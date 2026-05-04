import { BrainCircuit, TrendingUp, AlertOctagon } from "lucide-react";
import { motion } from "motion/react";

export function AiInsights() {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-[#0A1222] dark:to-[#111A30] rounded-2xl p-5 border border-slate-200 dark:border-indigo-500/20 shadow-lg relative overflow-hidden h-full flex flex-col">
      {/* Decorative bg */}
      <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-600 dark:text-white">
        <BrainCircuit className="w-32 h-32" />
      </div>

      <div className="flex items-center gap-3 mb-5 relative z-10">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg border border-indigo-200 dark:border-indigo-500/30">
          <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Sadak Sahayak AI</h3>
          <p className="text-[10px] text-indigo-600 dark:text-indigo-300">Predictive Analytics</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-3 rounded-xl bg-white/80 dark:bg-[#050B14]/50 border border-red-100 dark:border-slate-700/50 shadow-sm dark:shadow-none"
        >
          <div className="flex items-start gap-3">
            <AlertOctagon className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                <span className="font-semibold text-red-600 dark:text-red-400">High severity alert:</span> 
                {" "}Drunk driving incidents in Raipur Central have increased by 15% in the last 2 hours.
              </p>
              <button className="text-[10px] text-blue-600 dark:text-blue-400 mt-2 hover:underline">Deploy units →</button>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-3 rounded-xl bg-white/80 dark:bg-[#050B14]/50 border border-emerald-100 dark:border-slate-700/50 shadow-sm dark:shadow-none"
        >
          <div className="flex items-start gap-3">
            <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Performance update:</span> 
                {" "}Zone B (Bhilai) clearance rate is at 92% today, highest this week.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
