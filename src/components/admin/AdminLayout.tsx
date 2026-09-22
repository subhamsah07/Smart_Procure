import * as React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { SmartProcureLogo } from '../ui/SmartProcureLogo';
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Users,
  CreditCard,
  Coins,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  MapPin,
  ExternalLink,
  BarChart3,
  Sun,
  Moon,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { admin, assignedState, stateCode, adminSignOut } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Dark/Light Theme state with localStorage persistence
  const [darkMode, setDarkMode] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smartprocure_theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('smartprocure_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('smartprocure_theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  // Close mobile drawer on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const navItems = [
    { label: 'Overview', to: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Procurement Analysis', to: '/admin?tab=analysis', icon: BarChart3 },
    { label: 'Centres', to: '/admin/centres', icon: Building2 },
    { label: 'Requests', to: '/admin/requests', icon: ClipboardList },
    { label: 'Queue Foundation', to: '/admin/queue', icon: Users },
    { label: 'Payments', to: '/admin/payments', icon: CreditCard },
    { label: 'Crop Prices', to: '/admin/crop-prices', icon: Coins },
    { label: 'Notifications', to: '/admin/notifications', icon: Bell },
    { label: 'Settings', to: '/admin/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    await adminSignOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#f4f8f5] dark:bg-black flex flex-col font-sans antialiased text-slate-800 dark:text-neutral-100 transition-colors">
      {/* Top Administration Header with Dark/Light Support */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white shadow-xs transition-colors">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand with Official SmartProcure Logo & State Scope Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              {/* Official Project Logo replacing SP */}
              <div className="shrink-0 flex items-center justify-center">
                <SmartProcureLogo size={36} className="shrink-0 drop-shadow-xs" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight text-base sm:text-lg text-slate-900 dark:text-white">
                    Smart<span className="text-emerald-700 dark:text-emerald-400">Procure</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80">
                    Admin Portal
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
                  <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">{assignedState || 'State'}</span>
                  <span>Administration</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Controls & State Boundary Indicator */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* State Code Badge (Enforced Administrative State Jurisdiction) */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-slate-500 dark:text-neutral-400 font-medium">State:</span>
              <span className="font-bold text-slate-800 dark:text-neutral-200">{assignedState || 'Bihar'}</span>
              {stateCode && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                  {stateCode}
                </span>
              )}
            </div>

            {/* Officer Info */}
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 truncate max-w-[160px]">
                {admin?.adminName || 'State Officer'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400 truncate max-w-[160px]">
                {admin?.email || ''}
              </span>
            </div>

            {/* Dark/Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 transition"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Light and Dark Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-red-700 dark:hover:text-red-400 bg-slate-100 hover:bg-red-50 dark:bg-neutral-900 dark:hover:bg-red-950/40 border border-slate-200 dark:border-neutral-800 hover:border-red-300 dark:hover:border-red-900/60 transition"
              title="Sign Out of Admin Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main App Layout Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-neutral-950 border-r border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 transition-colors">
          <div className="p-4 border-b border-slate-200 dark:border-neutral-800">
            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-neutral-400">
                Operating Scope
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{assignedState} State Yard</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                RLS Boundary Enforced
              </p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isItemActive = item.to.includes('?tab=analysis')
                ? location.search.includes('tab=analysis')
                : location.pathname === item.to && !location.search.includes('tab=analysis');

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                      isItemActive
                        ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Quick Farmer Portal Link & Version Info */}
          <div className="p-4 border-t border-slate-200 dark:border-neutral-800 text-xs text-slate-500 dark:text-neutral-400 space-y-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 hover:bg-slate-100 dark:hover:bg-neutral-850 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-neutral-800 transition"
            >
              <span>View Farmer App</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
            <div className="text-[10px] text-slate-400 dark:text-neutral-500 px-1 pt-0.5">
              SmartProcure Administration v2.0 • Supabase RLS
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />

            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-neutral-950 text-slate-800 dark:text-neutral-300 shadow-2xl">
              <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <SmartProcureLogo size={32} className="shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">SmartProcure Admin</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{assignedState} Administration</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isItemActive = item.to.includes('?tab=analysis')
                    ? location.search.includes('tab=analysis')
                    : location.pathname === item.to && !location.search.includes('tab=analysis');

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.exact}
                      className={
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                          isItemActive
                            ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                            : 'text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 hover:text-slate-900 dark:hover:text-white'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-200 dark:border-neutral-800 space-y-2">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-300 bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                  <span>{darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-950/60"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area with Dark Mode Transition */}
        <main className="flex-1 overflow-y-auto bg-[#f4f8f5] dark:bg-black p-4 sm:p-6 lg:p-8 transition-colors">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

