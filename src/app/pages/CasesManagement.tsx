import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight, Filter, MapPin, MessageSquareText, Search, ShieldAlert, User, X } from "lucide-react";
import { mockCases, type ViolationCase } from "../mockCases";

type CaseFilters = {
  date: string;
  officer: string;
  violation: string;
  search: string;
};

const emptyFilters: CaseFilters = {
  date: "",
  officer: "",
  violation: "",
  search: "",
};

export function CasesManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<ViolationCase | null>(null);
  const [draftFilters, setDraftFilters] = useState<CaseFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<CaseFilters>(emptyFilters);
  const [pageSizeInput, setPageSizeInput] = useState("20");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const officerOptions = useMemo(
    () => Array.from(new Set(mockCases.map((item) => item.user_name))).sort(),
    [],
  );
  const violationOptions = useMemo(
    () => Array.from(new Set(mockCases.map((item) => item.reason))).sort(),
    [],
  );

  useEffect(() => {
    const filtersFromUrl = {
      date: searchParams.get("date") ?? "",
      officer: searchParams.get("officer") ?? "",
      violation: searchParams.get("violation") ?? "",
      search: searchParams.get("search") ?? "",
    };

    setDraftFilters(filtersFromUrl);
    setAppliedFilters(filtersFromUrl);
    setIsFilterOpen(Boolean(filtersFromUrl.date || filtersFromUrl.officer || filtersFromUrl.violation));
    setCurrentPage(1);
  }, [searchParams]);

  const filteredCases = useMemo(() => {
    const searchValue = appliedFilters.search.trim().toLowerCase();

    return [...mockCases]
      .sort((left, right) => right.timestamp - left.timestamp)
      .filter((item) => {
        const caseDate = getDateValue(item.created_at);
        const matchesDate = !appliedFilters.date || caseDate === appliedFilters.date;
        const matchesOfficer = !appliedFilters.officer || item.user_name === appliedFilters.officer;
        const matchesViolation = !appliedFilters.violation || item.reason === appliedFilters.violation;
        const matchesSearch =
          !searchValue ||
          [
            `CH${item.id}`,
            item.user_name,
            item.vehicle_number,
            item.reason,
            item.location,
            item.status,
          ].some((value) => value.toLowerCase().includes(searchValue));

        return matchesDate && matchesOfficer && matchesViolation && matchesSearch;
      });
  }, [appliedFilters]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredCases.length / pageSize));
    setCurrentPage((current) => Math.min(current, maxPage));
  }, [filteredCases.length, pageSize]);

  useEffect(() => {
    const caseId = searchParams.get("caseId");

    if (!caseId) {
      return;
    }

    const matchedCase = mockCases.find((item) => item.id === caseId);
    if (matchedCase) {
      setSelectedCase(matchedCase);
    }
  }, [searchParams]);

  const hasActiveFilters = Object.values(appliedFilters).some(Boolean);
  const totalPages = Math.max(1, Math.ceil(filteredCases.length / pageSize));
  const paginatedCases = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCases.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredCases, pageSize]);

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setSearchParams(buildSearchParams(draftFilters));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSearchParams({});
    setCurrentPage(1);
  };

  const applyPageSize = () => {
    const parsedValue = Number.parseInt(pageSizeInput, 10);
    const nextSize = Number.isNaN(parsedValue) ? 20 : Math.min(200, Math.max(1, parsedValue));
    setPageSize(nextSize);
    setPageSizeInput(String(nextSize));
    setCurrentPage(1);
  };

  const closeSelectedCase = () => {
    setSelectedCase(null);
    if (searchParams.get("caseId")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("caseId");
      setSearchParams(nextParams);
    }
  };

  return (
    <div className="relative flex flex-col h-full gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Challan Management</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review, filter, and inspect detailed violation records from field operations.
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
              {appliedFilters.search ? <FilterPill label={`Search: ${appliedFilters.search}`} /> : null}
              {appliedFilters.date ? <FilterPill label={appliedFilters.date} /> : null}
              {appliedFilters.officer ? <FilterPill label={appliedFilters.officer} /> : null}
              {appliedFilters.violation ? <FilterPill label={appliedFilters.violation} /> : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-lg backdrop-blur-sm dark:border-slate-700/50 dark:bg-[#1e293b]">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-700/50 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={draftFilters.search}
                onChange={(event) =>
                  setDraftFilters((current) => ({ ...current, search: event.target.value }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyFilters();
                  }
                }}
                placeholder="Search case id, officer, vehicle, violation, location..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-[#111C30] dark:text-slate-200"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={applyFilters}
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Search
              </button>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
                >
                  Reset
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span>{filteredCases.length} records found</span>
            <label className="flex items-center gap-2">
              <span>Cases per page</span>
              <input
                type="number"
                min="1"
                max="200"
                value={pageSizeInput}
                onChange={(event) => setPageSizeInput(event.target.value)}
                onBlur={applyPageSize}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyPageSize();
                  }
                }}
                className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-[#111C30] dark:text-slate-200"
              />
            </label>
          </div>
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
              {paginatedCases.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedCase(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedCase(item);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  className="cursor-pointer text-sm transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none dark:hover:bg-slate-800/50 dark:focus:bg-slate-800/50"
                >
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-gray-300">CH{item.id}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-gray-400">
                    {formatDateTime(item.created_at, { dateStyle: "medium" })}
                  </td>
                  <td className="px-6 py-4 text-slate-700 dark:text-gray-300">{item.vehicle_number}</td>
                  <td className="px-6 py-4 text-slate-700 dark:text-gray-300">{item.reason}</td>
                  <td className="px-6 py-4 text-slate-700 dark:text-gray-300">Rs. {item.fine}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-gray-400">{item.user_name}</td>
                  <td className="px-6 py-4">
                    <span className={getStatusClasses(item.status)}>{item.status}</span>
                  </td>
                </tr>
              ))}
              {paginatedCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No challans match the selected filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 dark:border-slate-700/50 dark:text-slate-400 md:flex-row md:items-center md:justify-between">
          <span>
            Showing {(currentPage - 1) * pageSize + (paginatedCases.length ? 1 : 0)}-
            {(currentPage - 1) * pageSize + paginatedCases.length} of {filteredCases.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <span className="min-w-20 text-center">
              Page {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedCase ? (
          <>
            <motion.button
              type="button"
              aria-label="Close case details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSelectedCase}
              className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px]"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#08111f]"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-700">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Officer Details
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedCase.user_name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    CH{selectedCase.id} • {selectedCase.reason} for {selectedCase.vehicle_number}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeSelectedCase}
                  className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <InfoCard
                    icon={<ShieldAlert className="h-4 w-4" />}
                    label="Severity"
                    value={selectedCase.severity}
                    valueClassName={getSeverityTextClasses(selectedCase.severity)}
                  />
                  <InfoCard
                    icon={<User className="h-4 w-4" />}
                    label="Officer"
                    value={selectedCase.user_name}
                  />
                  <InfoCard
                    icon={<MapPin className="h-4 w-4" />}
                    label="Status"
                    value={selectedCase.status}
                  />
                </div>

                <DetailSection title="Case Overview">
                  <DetailGrid
                    items={[
                      ["Case ID", `CH${selectedCase.id}`],
                      ["User ID", selectedCase.user_id],
                      ["Violation", selectedCase.reason],
                      ["Vehicle Number", selectedCase.vehicle_number],
                      ["Fine", `Rs. ${selectedCase.fine}`],
                      ["Language", selectedCase.language.toUpperCase()],
                      ["Created At", formatDateTime(selectedCase.created_at, { dateStyle: "medium", timeStyle: "short" })],
                      ["Event Timestamp", formatDateTime(selectedCase.timestamp * 1000, { dateStyle: "medium", timeStyle: "short" })],
                    ]}
                  />
                </DetailSection>

                <DetailSection title="Location">
                  <DetailGrid
                    items={[
                      ["Place", selectedCase.location],
                      ["Latitude", selectedCase.latitude.toFixed(6)],
                      ["Longitude", selectedCase.longitude.toFixed(6)],
                    ]}
                  />
                </DetailSection>

                <DetailSection title="Notes">
                  <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700 dark:bg-[#111C30] dark:text-slate-200">
                    {selectedCase.notes}
                  </p>
                </DetailSection>

                <DetailSection title="Chat History" icon={<MessageSquareText className="h-4 w-4" />}>
                  <pre className="whitespace-pre-wrap rounded-2xl bg-slate-950 px-4 py-4 text-sm leading-6 text-slate-100 dark:bg-[#030712]">
                    {selectedCase.chat_history}
                  </pre>
                </DetailSection>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
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

function InfoCard({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-[#111C30]">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {icon}
        {label}
      </div>
      <p className={`mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100 ${valueClassName ?? ""}`}>
        {value}
      </p>
    </div>
  );
}

function DetailSection({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}

function DetailGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-[#111C30]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 break-words text-sm font-medium text-slate-800 dark:text-slate-100">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

function getDateValue(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function formatDateTime(
  value: string | number,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("en-IN", options).format(new Date(value));
}

function getStatusClasses(status: ViolationCase["status"]) {
  if (status === "Paid") {
    return "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400";
  }

  if (status === "Disputed") {
    return "rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400";
  }

  return "rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-600 dark:text-orange-400";
}

function getSeverityTextClasses(severity: ViolationCase["severity"]) {
  if (severity === "high") {
    return "text-red-600 dark:text-red-400";
  }

  if (severity === "medium") {
    return "text-amber-600 dark:text-amber-400";
  }

  return "text-emerald-600 dark:text-emerald-400";
}

function buildSearchParams(filters: CaseFilters) {
  const nextParams: Record<string, string> = {};

  if (filters.search) {
    nextParams.search = filters.search;
  }

  if (filters.date) {
    nextParams.date = filters.date;
  }

  if (filters.officer) {
    nextParams.officer = filters.officer;
  }

  if (filters.violation) {
    nextParams.violation = filters.violation;
  }

  return nextParams;
}
