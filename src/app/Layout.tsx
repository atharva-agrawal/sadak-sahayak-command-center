import { NavLink, Outlet, useLocation } from "react-router";
import { 
  LayoutDashboard, 
  FileText, 
  TrendingUp, 
  ShieldAlert, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  ChevronDown,
  User,
  Sun,
  Moon
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export function Layout() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const getPageTitle = () => {
    if (location.pathname === '/') return 'Command Centre Overview';
    if (location.pathname === '/cases') return 'Violation Cases Database';
    if (location.pathname === '/revenue') return 'Financial Analytics';
    if (location.pathname === '/alerts') return 'Live Alerts & Hotspots';
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 dark:bg-[#050B14] dark:text-slate-200 font-sans overflow-hidden transition-colors duration-300">
      {/* Sidebar - Glassmorphic */}
      <motion.div 
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="w-20 bg-white/80 dark:bg-[#0A1222]/80 backdrop-blur-xl border-r border-slate-200 dark:border-indigo-500/10 flex flex-col items-center py-6 shadow-lg dark:shadow-[4px_0_24px_-4px_rgba(0,0,0,0.5)] z-20"
      >
        <div className="mb-8 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <ShieldAlert className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1 flex flex-col gap-4 w-full px-3">
          <NavItem to="/" icon={<LayoutDashboard />} label="Dashboard" />
          <NavItem to="/cases" icon={<FileText />} label="Cases" />
          <NavItem to="/revenue" icon={<TrendingUp />} label="Revenue" />
        </div>

        <div className="mt-auto w-full px-3 flex flex-col gap-4">
          <button className="w-full p-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all flex justify-center">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </motion.div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Ambient Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 dark:bg-blue-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-indigo-600/5 dark:bg-indigo-600/10 blur-[120px] pointer-events-none" />

        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-slate-200 dark:border-indigo-500/10 bg-white/60 dark:bg-[#050B14]/60 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
              {getPageTitle()}
            </h1>
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-xs font-medium tracking-wide">
              LIVE
            </span>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            {/* Global Search */}
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search cases, officers, vehicles..." 
                className="w-64 bg-slate-100 dark:bg-[#0A1222]/80 border border-transparent dark:border-indigo-500/20 rounded-full py-2 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
              />
            </div>

            {/* Theme Toggle */}
            <button 
              onClick={() => setIsDark(!isDark)}
              className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#050B14]"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-200 dark:hover:border-indigo-500/20"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px]">
                  <div className="w-full h-full rounded-full bg-white dark:bg-[#0A1222] flex items-center justify-center overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop" alt="Profile" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Cmdr. Sharma</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">HQ Supervisor</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0A1222] border border-slate-200 dark:border-indigo-500/20 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/50 overflow-hidden z-50"
                  >
                    <div className="p-2 space-y-1">
                      <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                        <User className="w-4 h-4" /> My Profile
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                        <Settings className="w-4 h-4" /> System Settings
                      </button>
                      <div className="h-px bg-slate-200 dark:bg-indigo-500/20 my-1" />
                      <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                        <LogOut className="w-4 h-4" /> Logout Session
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        
        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label, end = false }: { to: string, icon: React.ReactNode, label: string, end?: boolean }) {
  return (
    <NavLink 
      to={to} 
      end={end}
      className={({ isActive }) => 
        `relative w-full aspect-square flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-300 group
        ${isActive 
          ? 'bg-blue-50 dark:bg-gradient-to-b dark:from-blue-600/20 dark:to-indigo-600/20 text-blue-600 dark:text-blue-400 shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-blue-200 dark:border-blue-500/30' 
          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40 border border-transparent'}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div 
              layoutId="nav-indicator"
              className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-full"
            />
          )}
          <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
            {icon}
          </div>
          <span className="text-[10px] font-medium tracking-wide opacity-0 group-hover:opacity-100 absolute bottom-2 transition-opacity">
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}
