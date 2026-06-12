import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useMsal } from "@azure/msal-react";
import { ChevronLeft, ChevronRight, Filter, MessageSquareText, Search, X } from "lucide-react";
import { caseImageMap } from "../caseMedia";
import { backendScopes, fetchBackendCasesOnce, type BackendCase } from "../services/backendCases";
import { acquireBackendAccessToken } from "../services/authToken";

type CaseFilters = { date: string; officer: string; violation: string; search: string };
const emptyFilters: CaseFilters = { date: "", officer: "", violation: "", search: "" };

export function CasesManagement() {
  const { instance, accounts } = useMsal();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState<BackendCase[]>([]);
  const [loadError, setLoadError] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<BackendCase | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [draftFilters, setDraftFilters] = useState<CaseFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<CaseFilters>(emptyFilters);
  const [pageSizeInput, setPageSizeInput] = useState("20");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

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
        setLoadError("Unable to load cases data. Please sign in again.");
      }
    };
    void loadCases();
  }, [accounts, instance]);

  const officerOptions = useMemo(() => Array.from(new Set(cases.map((item) => item.user_name))).sort(), [cases]);
  const violationOptions = useMemo(() => Array.from(new Set(cases.map((item) => item.reason))).sort(), [cases]);

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
    return [...cases]
      .sort((left, right) => right.timestamp - left.timestamp)
      .filter((item) => {
        const caseDate = new Date(item.created_at).toISOString().slice(0, 10);
        const matchesDate = !appliedFilters.date || caseDate === appliedFilters.date;
        const matchesOfficer = !appliedFilters.officer || item.user_name === appliedFilters.officer;
        const matchesViolation = !appliedFilters.violation || item.reason === appliedFilters.violation;
        const matchesSearch =
          !searchValue ||
          [`CH${item.id}`, item.user_name, item.reason].some((value) => value.toLowerCase().includes(searchValue));
        return matchesDate && matchesOfficer && matchesViolation && matchesSearch;
      });
  }, [appliedFilters, cases]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredCases.length / pageSize));
    setCurrentPage((current) => Math.min(current, maxPage));
  }, [filteredCases.length, pageSize]);

  useEffect(() => {
    const caseId = searchParams.get("caseId");
    if (!caseId) return;
    const matchedCase = cases.find((item) => String(item.id) === caseId);
    if (matchedCase) setSelectedCase(matchedCase);
  }, [cases, searchParams]);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / pageSize));
  const paginatedCases = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCases.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredCases, pageSize]);

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    const nextParams: Record<string, string> = {};
    if (draftFilters.search) nextParams.search = draftFilters.search;
    if (draftFilters.date) nextParams.date = draftFilters.date;
    if (draftFilters.officer) nextParams.officer = draftFilters.officer;
    if (draftFilters.violation) nextParams.violation = draftFilters.violation;
    setSearchParams(nextParams);
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
    setSelectedImage(null);
    setSelectedCase(null);
    if (searchParams.get("caseId")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("caseId");
      setSearchParams(nextParams);
    }
  };

  const selectedCaseImages = selectedCase
    ? (selectedCase.images && selectedCase.images.length > 0
        ? selectedCase.images.map((img) => img.image_url)
        : caseImageMap[String(selectedCase.id)] ?? [])
    : [];

  return (
    <div className="relative flex flex-col h-full gap-6">
      {loadError ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          {loadError}
        </div>
      ) : null}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Challan Management</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review, filter, and inspect case records from backend.</p>
        </div>
        <div className="flex flex-col gap-3 xl:min-w-[560px]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <button type="button" onClick={() => setIsFilterOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700">
              <Filter className="h-4 w-4" /> Advanced Filter
            </button>
            <AnimatePresence initial={false}>
              {isFilterOpen ? (
                <motion.div initial={{ opacity: 0, x: -20, width: 0 }} animate={{ opacity: 1, x: 0, width: "100%" }} exit={{ opacity: 0, x: -20, width: 0 }} className="overflow-hidden">
                  <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-lg">
                    <div className="grid gap-3 md:grid-cols-3">
                      <input type="date" value={draftFilters.date} onChange={(event) => setDraftFilters((current) => ({ ...current, date: event.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                      <select value={draftFilters.officer} onChange={(event) => setDraftFilters((current) => ({ ...current, officer: event.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                        <option value="">All officers</option>
                        {officerOptions.map((officer) => <option key={officer} value={officer}>{officer}</option>)}
                      </select>
                      <select value={draftFilters.violation} onChange={(event) => setDraftFilters((current) => ({ ...current, violation: event.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                        <option value="">All violations</option>
                        {violationOptions.map((violation) => <option key={violation} value={violation}>{violation}</option>)}
                      </select>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button type="button" onClick={applyFilters} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Apply Filters</button>
                      <button type="button" onClick={clearFilters} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Clear</button>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-lg">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="text" value={draftFilters.search} onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") applyFilters(); }} placeholder="Search case id, officer, violation..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700" />
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>{filteredCases.length} records found</span>
            <input type="number" min="1" max="200" value={pageSizeInput} onChange={(event) => setPageSizeInput(event.target.value)} onBlur={applyPageSize} className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-sm font-medium text-slate-600">
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Violation</th>
                <th className="px-6 py-4 font-semibold">Officer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedCases.map((item) => (
                <tr key={item.id} onClick={() => setSelectedCase(item)} className="cursor-pointer text-sm transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-700">CH{item.id}</td>
                  <td className="px-6 py-4 text-slate-500">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(item.created_at))}</td>
                  <td className="px-6 py-4 text-slate-700">{item.reason}</td>
                  <td className="px-6 py-4 text-slate-500">{item.user_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
          <span>Page {currentPage} / {totalPages}</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2"><ChevronLeft className="h-4 w-4" />Prev</button>
            <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">Next<ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedCase ? (
          <>
            <motion.button type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeSelectedCase} className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px]" />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.3, ease: "easeOut" }} className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Officer Details</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">{selectedCase.user_name}</h3>
                  <p className="mt-1 text-sm text-slate-500">CH{selectedCase.id} | {selectedCase.reason}</p>
                </div>
                <button type="button" onClick={closeSelectedCase} className="rounded-full border border-slate-200 p-2 text-slate-500"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                <DetailSection title="Case Overview">
                  <DetailGrid items={[
                    ["Case ID", `CH${selectedCase.id}`],
                    ["User ID", selectedCase.user_id],
                    ["Violation", selectedCase.reason],
                    ["Language", selectedCase.language.toUpperCase()],
                    ["Created At", formatDateTimeSafe(selectedCase.created_at)],
                    ["Event Timestamp", formatDateTimeSafe(selectedCase.timestamp)],
                  ]} />
                </DetailSection>
                <DetailSection title="Coordinates">
                  <DetailGrid items={[["Latitude", selectedCase.latitude.toFixed(6)], ["Longitude", selectedCase.longitude.toFixed(6)]]} />
                </DetailSection>
                <DetailSection title="Notes">
                  <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">{selectedCase.notes ?? "No notes available."}</p>
                </DetailSection>
                <DetailSection title="Chat History" icon={<MessageSquareText className="h-4 w-4" />}>
                  <pre className="whitespace-pre-wrap rounded-2xl bg-slate-950 px-4 py-4 text-sm leading-6 text-slate-100">{selectedCase.chat_history ?? "No chat history available."}</pre>
                </DetailSection>
                {selectedCaseImages.length > 0 ? (
                  <DetailSection title="Case Images">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {selectedCaseImages.map((imageSrc, index) => (
                        <button key={`${selectedCase.id}-image-${index}`} type="button" onClick={() => setSelectedImage(imageSrc)} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-left transition hover:border-blue-300">
                          <img src={imageSrc} alt={`${selectedCase.user_name} case evidence ${index + 1}`} className="h-52 w-full bg-slate-100 object-contain" />
                        </button>
                      ))}
                    </div>
                  </DetailSection>
                ) : null}
              </div>
            </motion.aside>
            <AnimatePresence>
              {selectedImage ? (
                <>
                  <motion.button type="button" aria-label="Close image preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedImage(null)} className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-md" />
                  <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="fixed inset-0 z-[70] flex items-center justify-center p-6">
                    <div className="relative flex max-h-[90vh] w-full max-w-5xl items-center justify-center rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-2xl">
                      <button type="button" onClick={() => setSelectedImage(null)} className="absolute right-4 top-4 rounded-full border border-slate-200 bg-white/90 p-2 text-slate-600"><X className="h-5 w-5" /></button>
                      <img src={selectedImage} alt={`${selectedCase.user_name} full evidence view`} className="max-h-[82vh] w-full rounded-2xl object-contain" />
                    </div>
                  </motion.div>
                </>
              ) : null}
            </AnimatePresence>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function DetailSection({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{icon}{title}</div>
      {children}
    </section>
  );
}

function DetailGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 break-words text-sm font-medium text-slate-800">{value}</p>
        </div>
      ))}
    </div>
  );
}

function formatDateTimeSafe(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  const numericValue = typeof value === "number" ? value : Number(value);
  let date: Date;

  if (!Number.isNaN(numericValue) && Number.isFinite(numericValue)) {
    const normalized = numericValue > 1_000_000_000_000 ? numericValue : numericValue * 1000;
    date = new Date(normalized);
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
