import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Filter, Search, X } from "lucide-react";
import { mockCases } from "../mockData";

type ChallanRow = {
  challanId: string;
  date: string;
  vehicleNumber: string;
  violation: string;
  fine: number;
  officer: string;
  status: string;
};

const manualRows: ChallanRow[] = [
  {
    challanId: "CH106",
    date: "2026-05-01",
    vehicleNumber: "DL02XY9999",
    violation: "Signal Jump",
    fine: 1000,
    officer: "Ramesh",
    status: "Pending",
  },
  {
    challanId: "CH107",
    date: "2026-05-01",
    vehicleNumber: "MH01AB1111",
    violation: "Speeding",
    fine: 2000,
    officer: "Amit Kumar",
    status: "Paid",
  },
  {
    challanId: "CH108",
    date: "2026-04-30",
    vehicleNumber: "KA05CD2222",
    violation: "No Helmet",
    fine: 500,
    officer: "Rahul Singh",
    status: "Pending",
  },
];

const challanRows: ChallanRow[] = [
  ...mockCases.map((item, index) => ({
    challanId: `CH10${index + 1}`,
    date: new Date(item.timestamp * 1000).toISOString().slice(0, 10),
    vehicleNumber: item.vehicle_number,
    violation: item.reason,
    fine: item.fine,
    officer: item.user_name,
    status: item.status,
  })),
  ...manualRows,
];

export function CasesManagement() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState({
    date: "",
    officer: "",
    violation: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    date: "",
    officer: "",
    violation: "",
  });

  const officerOptions = useMemo(
    () => Array.from(new Set(challanRows.map((item) => item.officer))).sort(),
    [],
  );
  const violationOptions = useMemo(
    () => Array.from(new Set(challanRows.map((item) => item.violation))).sort(),
    [],
  );

  const filteredCases = useMemo(() => {
    return challanRows.filter((item) => {
      const matchesDate = !appliedFilters.date || item.date === appliedFilters.date;
      const matchesOfficer = !appliedFilters.officer || item.officer === appliedFilters.officer;
      const matchesViolation = !appliedFilters.violation || item.violation === appliedFilters.violation;

      return matchesDate && matchesOfficer && matchesViolation;
    });
  }, [appliedFilters]);

  const hasActiveFilters = Object.values(appliedFilters).some(Boolean);

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
  };

  const clearFilters = () => {
    const emptyFilters = { date: "", officer: "", violation: "" };
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Challan Management</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review and filter violation records collected from field operations.
          </p>
        </div>

        <div className="flex flex-col gap-3 xl:min-w-[560px]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <button
              type="button"
              onClick={() => setIsFilterOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-[#0A1222]/80 dark:text-slate-200 dark:hover:border-blue-500/30 dark:hover:text-blue-300"
            >
              <Filter className="h-4 w-4" />
              Advanced Filter
            </button>

            <AnimatePresence initial={false}>
              {isFilterOpen ? (
                <motion.div
                  initial={{ opacity: 0, x: -20, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: "100%" }}
                  exit={{ opacity: 0, x: -20, width: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-lg dark:border-slate-700 dark:bg-[#0A1222]/85">
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Date
                        <input
                          type="date"
                          value={draftFilters.date}
                          onChange={(event) =>
                            setDraftFilters((current) => ({ ...current, date: event.target.value }))
                          }
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-[#111C30] dark:text-slate-200"
                        />
                      </label>

                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Officer Name
                        <select
                          value={draftFilters.officer}
                          onChange={(event) =>
                            setDraftFilters((current) => ({ ...current, officer: event.target.value }))
                          }
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-[#111C30] dark:text-slate-200"
                        >
                          <option value="">All officers</option>
                          {officerOptions.map((officer) => (
                            <option key={officer} value={officer}>
                              {officer}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Violation
                        <select
                          value={draftFilters.violation}
                          onChange={(event) =>
                            setDraftFilters((current) => ({ ...current, violation: event.target.value }))
                          }
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-[#111C30] dark:text-slate-200"
                        >
                          <option value="">All violations</option>
                          {violationOptions.map((violation) => (
                            <option key={violation} value={violation}>
                              {violation}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={applyFilters}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Apply Filters
                      </button>
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-2">
              {appliedFilters.date ? <FilterPill label={appliedFilters.date} /> : null}
              {appliedFilters.officer ? <FilterPill label={appliedFilters.officer} /> : null}
              {appliedFilters.violation ? <FilterPill label={appliedFilters.violation} /> : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-lg backdrop-blur-sm dark:border-slate-700/50 dark:bg-[#1e293b]">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700/50 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Search className="h-4 w-4" />
            <span>{filteredCases.length} records visible</span>
          </div>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
              Reset active filters
            </button>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-[#334155]/50 dark:text-gray-300">
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Vehicle</th>
                <th className="px-6 py-4 font-semibold">Violation</th>
                <th className="px-6 py-4 font-semibold">Fine</th>
                <th className="px-6 py-4 font-semibold">Officer</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {filteredCases.map((item) => (
                <tr key={item.challanId} className="text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-gray-300">{item.challanId}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-gray-400">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-slate-700 dark:text-gray-300">{item.vehicleNumber}</td>
                  <td className="px-6 py-4 text-slate-700 dark:text-gray-300">{item.violation}</td>
                  <td className="px-6 py-4 text-slate-700 dark:text-gray-300">Rs. {item.fine}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-gray-400">{item.officer}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        item.status === "Paid"
                          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No challans match the selected filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FilterPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
      {label}
    </span>
  );
}
