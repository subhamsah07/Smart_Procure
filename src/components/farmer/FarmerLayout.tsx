import * as React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarPlus,
  Compass,
  Activity,
  History,
  Bell,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Globe,
  Sun,
  Moon,
  ChevronDown,
  PlayCircle,
  LifeBuoy
} from 'lucide-react';
import { Button } from '../ui/Button';
import { SmartProcureLogo } from '../ui/SmartProcureLogo';
import { BotanicalGrassTexture } from '../common/BotanicalGrassTexture';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import { LANGUAGES, SupportedLanguage, normalizeLanguage } from '../../i18n';
import { useTranslation } from 'react-i18next';
import { HelpModal } from '../landing/HelpModal';

interface FarmerLayoutProps {
  children: React.ReactNode;
}

export const FarmerLayout: React.FC<FarmerLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { profile, user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [helpModalOpen, setHelpModalOpen] = React.useState(false);
  const [helpModalTab, setHelpModalTab] = React.useState<'contact' | 'feedback' | 'videos'>('videos');

  // Theme state
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

  // Real notifications subscription for badge
  React.useEffect(() => {
    let active = true;
    const fetchUnread = async () => {
      try {
        const notifs = await notificationService.getNotifications();
        if (active && notifs) {
          const unread = notifs.filter((n) => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.warn('Failed to load notifications count in navbar:', err);
      }
    };
    fetchUnread();

    const unsub = notificationService.subscribeToNotifications(() => {
      fetchUnread();
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  const [currentLang, setCurrentLang] = React.useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smartprocure_language') || localStorage.getItem('i18nextLng');
      if (saved) return normalizeLanguage(saved);
    }
    return normalizeLanguage(i18n.language);
  });

  React.useEffect(() => {
    const handleLangChange = (lng: string) => {
      setCurrentLang(normalizeLanguage(lng));
    };
    i18n.on('languageChanged', handleLangChange);
    return () => {
      i18n.off('languageChanged', handleLangChange);
    };
  }, [i18n]);

  const handleLanguageSelect = (code: SupportedLanguage) => {
    setCurrentLang(code);
    i18n.changeLanguage(code);
    try {
      localStorage.setItem('smartprocure_language', code);
      localStorage.setItem('i18nextLng', code);
      window.dispatchEvent(new Event('smartprocure_lang_changed'));
    } catch {
      // ignore
    }
    setLangDropdownOpen(false);
  };

  const farmerName = profile?.fullName || (user?.user_metadata?.fullName as string) || 'Farmer';
  const farmerDistrict = profile?.district || (user?.user_metadata?.district as string) || '';
  const farmerState = profile?.state || (user?.user_metadata?.state as string) || '';
  const farmerBankName = profile?.bankAccount?.bankName || (user?.user_metadata?.bankAccount?.bankName as string) || 'Registered Bank';
  const rawAcct = profile?.bankAccount?.accountNumber || (user?.user_metadata?.bankAccount?.accountNumber as string) || '';
  const maskedAcct = rawAcct.length > 4 ? `••••••••${rawAcct.slice(-4)}` : rawAcct ? '••••' : '';
  const initials = farmerName.slice(0, 2).toUpperCase();

  const navigationItems = [
    { label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard, path: '/farmer', altPath: '/dashboard' },
    { label: t('nav.bookSlot', 'Book Slot'), icon: CalendarPlus, path: '/farmer/booking', altPath: '/dashboard/book' },
    { label: t('nav.findCentre', 'Find Centre'), icon: Compass, path: '/farmer/centres', altPath: '/dashboard/centres' },
    { label: t('nav.trackToken', 'Track Token'), icon: Activity, path: '/farmer/token', altPath: '/dashboard/track' },
    { label: t('nav.history', 'History'), icon: History, path: '/farmer/history', altPath: '/dashboard/history' },
    { label: t('nav.notifications', 'Notifications'), icon: Bell, path: '/farmer/notifications', altPath: '/dashboard/notifications', badge: unreadCount > 0 ? String(unreadCount) : undefined },
    { label: t('nav.settings', 'Settings'), icon: Settings, path: '/farmer/settings', altPath: '/dashboard/settings' },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      navigate('/login', {
        replace: true,
        state: { message: 'You have been signed out securely.' },
      });
    }
  };

  const isItemActive = (path: string, altPath?: string) => {
    return location.pathname === path || (altPath && location.pathname === altPath);
  };

  return (
    <div className="min-h-screen bg-[#f4f8f5] dark:bg-black text-slate-900 dark:text-neutral-100 flex flex-col transition-colors duration-200 relative overflow-x-hidden">
      {/* Minimal Subtle Botanical Grass Texture */}
      <BotanicalGrassTexture intensity="subtle" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 border-b border-slate-200 dark:border-neutral-800 backdrop-blur-xs">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* LEFT: SmartProcure logo + SmartProcure */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link to="/farmer" className="flex items-center gap-2.5 focus:outline-none">
              <SmartProcureLogo size={34} />
              <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
                Smart<span className="text-emerald-700 dark:text-emerald-400">Procure</span>
              </span>
            </Link>
          </div>

          {/* RIGHT: Notification Bell, Language, Theme Toggle, Farmer Account */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell Icon */}
            <Link
              to="/farmer/notifications"
              className="relative p-2 rounded-lg text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors"
              title={t('nav.notifications', 'Notifications')}
              aria-label={t('nav.notifications', 'Notifications')}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-black">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Demo Videos / Help & Support */}
            <button
              type="button"
              onClick={() => {
                setHelpModalTab('videos');
                setHelpModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-900 text-xs font-semibold transition-colors cursor-pointer"
              title={t('nav.demoVideos', 'Demo Videos')}
              aria-label={t('nav.demoVideos', 'Demo Videos')}
            >
              <PlayCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span className="hidden sm:inline">{t('nav.demoVideos', 'Demo Videos')}</span>
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setLangDropdownOpen(!langDropdownOpen);
                  setProfileDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-900 text-xs font-semibold transition-colors"
                aria-label="Select Language"
              >
                <Globe className="h-3.5 w-3.5 text-slate-500 dark:text-neutral-400" />
                <span className="hidden sm:inline">
                  {LANGUAGES.find((l) => l.code === currentLang)?.nativeName || 'English'}
                </span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-xl py-1 z-50 text-xs">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageSelect(lang.code)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                        currentLang === lang.code
                          ? 'font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                          : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-900'
                      }`}
                    >
                      <span>{lang.nativeName}</span>
                      <span className="text-[10px] opacity-60">{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-900 transition-colors"
              aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
            </button>

            {/* Farmer Account Profile */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setLangDropdownOpen(false);
                }}
                className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-neutral-800 cursor-pointer focus:outline-none"
                aria-label="User profile"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-xs border border-emerald-300 dark:border-emerald-800">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <span className="max-w-[120px] truncate">{farmerName}</span>
                    <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  </div>
                  {(farmerDistrict || farmerState) && (
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400 truncate max-w-[120px]">
                      {farmerDistrict ? `${farmerDistrict}, ` : ''}{farmerState}
                    </div>
                  )}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-500 hidden sm:block" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-xl py-2 z-50 text-xs">
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-neutral-800">
                    <span className="font-bold text-slate-900 dark:text-white block truncate">
                      {farmerName}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400 block truncate">
                      {user?.email || user?.phone || 'Verified Farmer'}
                    </span>
                  </div>

                  {maskedAcct && (
                    <div className="px-3.5 py-2 text-[11px] text-slate-500 dark:text-neutral-400 border-b border-slate-100 dark:border-neutral-800">
                      <span className="block font-medium text-slate-700 dark:text-neutral-300">{farmerBankName}</span>
                      <span className="font-mono text-[10px]">{maskedAcct}</span>
                    </div>
                  )}

                  <Link
                    to="/farmer/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 text-slate-400" />
                    <span>{t('nav.settings', 'Settings')}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>{t('auth.signOut', 'Sign Out')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main App Body */}
      <div className="flex-1 flex pb-16 lg:pb-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 bg-white dark:bg-black border-r border-slate-200 dark:border-neutral-800 shrink-0">
          <div className="p-4 flex-1 space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
              {t('nav.procurementServices', 'Procurement Services')}
            </div>

            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.path, item.altPath);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200/70 dark:border-emerald-800/60'
                      : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-900 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${active ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-neutral-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-orange-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Account & Logout in Sidebar */}
          <div className="p-4 border-t border-slate-200 dark:border-neutral-800 space-y-2">
            <button
              type="button"
              onClick={() => {
                setHelpModalTab('videos');
                setHelpModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
            >
              <PlayCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('nav.demoVideos', 'Demo Videos')}</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-800 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-neutral-700 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{t('auth.signOut', 'Sign Out')}</span>
            </button>
          </div>
        </aside>

        {/* Mobile Slide-out Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-white dark:bg-black h-full flex flex-col shadow-xl z-10 border-r border-slate-200 dark:border-neutral-800">
              <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">SmartProcure</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-3 flex-1 overflow-y-auto space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.path, item.altPath);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                        active
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="bg-orange-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-neutral-800 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setHelpModalTab('videos');
                    setHelpModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
                >
                  <PlayCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('nav.demoVideos', 'Demo Videos')}</span>
                </button>

                <Button variant="outline" size="sm" className="w-full justify-center" onClick={handleLogout}>
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  {t('auth.signOut', 'Sign Out')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full relative z-10">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-black/95 border-t border-slate-200 dark:border-neutral-800 px-2 py-1.5 flex items-center justify-around shadow-lg backdrop-blur-xs">
        {navigationItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.path, item.altPath);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
                active ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-600 ring-1 ring-white dark:ring-black" />
                )}
              </div>
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Help & Support Modal with Demo Videos */}
      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        defaultTab={helpModalTab}
        darkMode={darkMode}
      />
    </div>
  );
};

