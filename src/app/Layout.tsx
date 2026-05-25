import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  FileText,
  ShieldAlert,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  User,
  Sun,
  Moon,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useMsal } from "@azure/msal-react";
import { mockCases } from "./mockCases";

export function Layout() {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const activeAccount = accounts[0];
  const displayName = activeAccount?.name ?? "Cmdr. Sharma";
  const displayEmail = activeAccount?.username ?? "placeholder@department.gov.in";

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const globalResults = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();
    if (!query) {
      return [];
    }

    return mockCases
      .filter((item) =>
        [
          `CH${item.id}`,
          item.user_name,
          item.reason,
        ].some((value) => value.toLowerCase().includes(query)),
      )
      .slice(0, 3);
  }, [globalSearch]);

  const getPageTitle = () => {
    if (location.pathname === "/") return "Command Centre Overview";
    if (location.pathname === "/cases") return "Violation Cases Database";
    return "Dashboard";
  };

  const submitGlobalSearch = () => {
    const query = globalSearch.trim();
    if (!query) {
      return;
    }

    navigate(`/cases?search=${encodeURIComponent(query)}`);
    setSearchFocused(false);
  };

  const openSearchResult = (caseId: string) => {
    navigate(`/cases?caseId=${encodeURIComponent(caseId)}`);
    setGlobalSearch("");
    setSearchFocused(false);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900 transition-colors duration-300 dark:bg-[#050B14] dark:text-slate-200">
      <motion.div
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="z-20 flex w-20 flex-col items-center border-r border-slate-200 bg-white/80 py-6 shadow-lg backdrop-blur-xl dark:border-indigo-500/10 dark:bg-[#0A1222]/80 dark:shadow-[4px_0_24px_-4px_rgba(0,0,0,0.5)]"
      >
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
          <ShieldAlert className="h-6 w-6 text-white" />
        </div>

        <div className="flex w-full flex-1 flex-col gap-4 px-3">
          <NavItem to="/" icon={<LayoutDashboard />} label="Dashboard" />
          <NavItem to="/cases" icon={<FileText />} label="Cases" />
        </div>

        <div className="mt-auto flex w-full flex-col gap-4 px-3">
          <button className="flex w-full justify-center rounded-xl p-3 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white">
            <Settings className="h-6 w-6" />
          </button>
        </div>
      </motion.div>

      <div className="relative flex flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-blue-600/5 blur-[120px] dark:bg-blue-600/10" />
        <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[30%] w-[30%] rounded-full bg-indigo-600/5 blur-[120px] dark:bg-indigo-600/10" />

        <header className="z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white/60 px-8 backdrop-blur-md dark:border-indigo-500/10 dark:bg-[#050B14]/60">
          <div className="flex items-center gap-4">
            <h1 className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-2xl font-semibold text-transparent dark:from-blue-400 dark:to-indigo-300">
              {getPageTitle()}
            </h1>
            <span className="rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-medium tracking-wide text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
              LIVE
            </span>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400" />
              <input
                type="text"
                value={globalSearch}
                onChange={(event) => setGlobalSearch(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    submitGlobalSearch();
                  }
                }}
                placeholder="Search cases, officers, violations..."
                className="w-72 rounded-full border border-transparent bg-slate-100 py-2 pl-10 pr-4 text-sm text-slate-800 transition-all placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 dark:border-indigo-500/20 dark:bg-[#0A1222]/80 dark:text-slate-200"
              />

              {searchFocused && globalResults.length > 0 ? (
                <div className="absolute right-0 top-full mt-3 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-[#0A1222]">
                  {globalResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openSearchResult(item.id)}
                      className="flex w-full flex-col gap-1 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-[#111C30]"
                    >
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {item.user_name}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        CH{item.id} | {item.reason}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              onClick={() => setIsDark(!isDark)}
              className="relative rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <button className="relative rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#050B14]" />
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 rounded-full border border-transparent p-1.5 pr-3 transition-all hover:border-slate-200 hover:bg-slate-100 dark:hover:border-indigo-500/20 dark:hover:bg-slate-800/50"
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px]">
                  <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white dark:bg-[#0A1222]">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop"
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{displayName}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">HQ Supervisor</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              <AnimatePresence>
                {profileOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-black/10 dark:border-indigo-500/20 dark:bg-[#0A1222] dark:shadow-black/50"
                  >
                    <div className="space-y-1 p-2">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          setProfilePanelOpen(true);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-blue-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-white"
                      >
                        <User className="h-4 w-4" /> My Profile
                      </button>
                      <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-blue-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-white">
                        <Settings className="h-4 w-4" /> System Settings
                      </button>
                      <div className="my-1 h-px bg-slate-200 dark:bg-indigo-500/20" />
                      <button
                        type="button"
                        onClick={() => instance.logoutRedirect()}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                      >
                        <LogOut className="h-4 w-4" /> Logout Session
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 scroll-smooth">
          <Outlet />
        </main>

        <AnimatePresence>
          {profilePanelOpen ? (
            <>
              <motion.button
                type="button"
                aria-label="Close profile panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setProfilePanelOpen(false)}
                className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px]"
              />

              <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#08111f]"
              >
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-700">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Profile
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {displayName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      HQ dashboard access profile
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setProfilePanelOpen(false)}
                    className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-[#111C30]">
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 overflow-hidden rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-500 p-[3px]">
                        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[14px] bg-white dark:bg-[#0A1222]">
                          <img
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop"
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{displayName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Supervisor Profile Placeholder</p>
                      </div>
                    </div>
                  </div>

                  <ProfileSection
                    title="Identity & Role"
                    items={[
                      ["Name", displayName],
                      ["Badge / Employee ID", "Placeholder"],
                      ["Rank", "SP / HQ Supervisor"],
                      ["Department", "Traffic Command Center"],
                      ["Assigned Zone / District", "Placeholder"],
                    ]}
                  />

                  <ProfileSection
                    title="Account & Access Info"
                    items={[
                      ["Login Email", displayEmail],
                      ["Last Login", "Placeholder timestamp"],
                      ["Access Level", "Dashboard read/write placeholder"],
                    ]}
                  />

                  <ProfileSection
                    title="System Preferences"
                    items={[
                      ["Language", "Placeholder"],
                      ["Notifications", "Placeholder"],
                      ["Theme", isDark ? "Dark" : "Light"],
                    ]}
                  />
                </div>
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label, end = false }: { to: string; icon: React.ReactNode; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `relative w-full aspect-square flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-300 group ${
          isActive
            ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-200 dark:bg-gradient-to-b dark:from-blue-600/20 dark:to-indigo-600/20 dark:text-blue-400 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] dark:border-blue-500/30"
            : "border border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800/40 dark:hover:text-slate-300"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <motion.div layoutId="nav-indicator" className="absolute left-0 h-8 w-1 rounded-r-full bg-blue-500" />
          ) : null}
          <div className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
            {icon}
          </div>
          <span className="absolute bottom-2 text-[10px] font-medium tracking-wide opacity-0 transition-opacity group-hover:opacity-100">
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

function ProfileSection({
  title,
  items,
}: {
  title: string;
  items: Array<[string, string]>;
}) {
  return (
    <section>
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h4>
      <div className="grid gap-3">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-[#111C30]">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">
              {value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
