import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Shield,
  Menu,
  X,
  ArrowRight,
  Sun,
  Moon,
  HelpCircle,
  Mail,
  MessageSquareText,
  ChevronDown,
  PhoneCall,
  PlayCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, SupportedLanguage, normalizeLanguage } from '../../i18n';
import { SmartProcureLogo } from '../ui/SmartProcureLogo';
import { HelpModal } from '../landing/HelpModal';
import { IvrSupportModal } from '../landing/IvrSupportModal';

export interface NavbarProps {
  darkMode?: boolean;
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode = false, onToggleTheme }) => {
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = React.useState(false);
  const [helpDropdownOpen, setHelpDropdownOpen] = React.useState(false);
  const [helpModalOpen, setHelpModalOpen] = React.useState(false);
  const [helpModalTab, setHelpModalTab] = React.useState<'contact' | 'feedback' | 'videos'>('contact');
  const [ivrModalOpen, setIvrModalOpen] = React.useState(false);

  React.useEffect(() => {
    const handleOpenIvr = () => setIvrModalOpen(true);
    window.addEventListener('smartprocure_open_ivr', handleOpenIvr);
    return () => window.removeEventListener('smartprocure_open_ivr', handleOpenIvr);
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

  const openContactHelp = () => {
    setHelpModalTab('contact');
    setHelpModalOpen(true);
    setHelpDropdownOpen(false);
  };

  const openFeedbackHelp = () => {
    setHelpModalTab('feedback');
    setHelpModalOpen(true);
    setHelpDropdownOpen(false);
  };

  const openDemoVideosHelp = () => {
    setHelpModalTab('videos');
    setHelpModalOpen(true);
    setHelpDropdownOpen(false);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-colors duration-200 backdrop-blur-md border-b ${
          darkMode
            ? 'bg-black/95 border-emerald-900/60 text-slate-100'
            : 'bg-white/95 border-emerald-100 text-slate-900 shadow-2xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          {/* Left: Brand Logo & Title */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group focus:outline-hidden">
            <div className="transition-transform group-hover:scale-105 duration-200 shrink-0">
              <SmartProcureLogo size={36} />
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight">
              Smart<span className="text-emerald-600 dark:text-emerald-400">Procure</span>
            </span>
          </Link>

          {/* Desktop Controls in Strict Requested Order:
              1. Language selector
              2. Day/Night mode toggle
              3. Farmer Login
              4. Admin Login (with Official Login button)
              5. Help Button
          */}
          <div className="hidden md:flex items-center gap-2 lg:gap-2.5">
            {/* 1. Language Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setLangDropdownOpen(!langDropdownOpen);
                  setHelpDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  darkMode
                    ? 'border-neutral-800 bg-neutral-900 text-slate-200 hover:bg-neutral-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
                aria-label="Select Language"
              >
                <Globe className="h-3.5 w-3.5 text-emerald-500" />
                <span>{LANGUAGES.find((l) => l.code === currentLang)?.nativeName || 'English'}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {langDropdownOpen && (
                <div
                  className={`absolute left-0 mt-2 w-44 rounded-xl border shadow-xl py-1.5 z-50 text-xs ${
                    darkMode
                      ? 'bg-neutral-900 border-neutral-800 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageSelect(lang.code)}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between transition-colors ${
                        currentLang === lang.code
                          ? darkMode
                            ? 'font-bold text-emerald-400 bg-emerald-950/40'
                            : 'font-bold text-emerald-700 bg-emerald-50'
                          : darkMode
                          ? 'hover:bg-neutral-800'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <span>{lang.nativeName}</span>
                      <span className="text-[11px] opacity-60">{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Day/Night Mode Toggle */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  darkMode
                    ? 'border-neutral-800 bg-neutral-900 text-amber-300 hover:bg-neutral-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}

            {/* 3. Farmer Login */}
            <Link to="/login">
              <button
                type="button"
                className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors border cursor-pointer ${
                  darkMode
                    ? 'border-neutral-800 bg-neutral-900 text-slate-200 hover:bg-neutral-800 hover:border-emerald-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-emerald-300'
                }`}
              >
                {t('landing.farmerLogin', 'Farmer Login')}
              </button>
            </Link>

            {/* 4. Admin Login */}
            <Link to="/admin/login">
              <button
                type="button"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  darkMode
                    ? 'border-neutral-800 bg-neutral-900 text-slate-200 hover:border-emerald-700 hover:text-emerald-400'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700'
                }`}
                aria-label="Open Admin Portal"
              >
                <Shield className="h-3.5 w-3.5 text-emerald-500" />
                <span>{t('nav.adminLogin', 'Admin Login')}</span>
              </button>
            </Link>

            {/* 5. IVR Support Option */}
            <button
              type="button"
              onClick={() => {
                setIvrModalOpen(true);
                setHelpDropdownOpen(false);
                setLangDropdownOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                darkMode
                  ? 'border-neutral-800 bg-neutral-900 text-slate-200 hover:border-emerald-700 hover:text-emerald-400'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700'
              }`}
              aria-label="Open IVR Support and Helpline Info"
              title="Toll-Free IVR Kisan Helpline 1800-180-1551"
            >
              <PhoneCall className="h-3.5 w-3.5 text-emerald-500" />
              <span>{t('nav.ivrSupport', 'IVR Support')}</span>
            </button>

            {/* 6. Help Button (with dropdown: Contact Us + Feedback + IVR Helpline) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setHelpDropdownOpen(!helpDropdownOpen);
                  setLangDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  helpDropdownOpen
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300'
                    : darkMode
                    ? 'border-neutral-800 bg-neutral-900 text-slate-200 hover:border-emerald-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                }`}
                aria-label="Open Help and Feedback"
              >
                <HelpCircle className="h-3.5 w-3.5 text-emerald-500" />
                <span>{t('nav.help', 'Help')}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {helpDropdownOpen && (
                <div
                  className={`absolute right-0 mt-2 w-52 rounded-xl border shadow-xl py-2 z-50 text-xs transition-all ${
                    darkMode
                      ? 'bg-neutral-900 border-neutral-800 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-neutral-800 mb-1">
                    {t('nav.farmerAssistance', 'Farmer Assistance')}
                  </div>

                  {/* Option 1: Contact Us */}
                  <button
                    type="button"
                    onClick={openContactHelp}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 transition-colors cursor-pointer ${
                      darkMode ? 'hover:bg-neutral-800 text-white' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <Mail className="h-4 w-4 text-emerald-500" />
                    <div>
                      <div className="font-bold">{t('nav.contactUs', 'Contact Us')}</div>
                      <div className="text-[10px] text-slate-400">smartprocurementsystem@gmail.com</div>
                    </div>
                  </button>

                  {/* Option 2: Demo Videos */}
                  <button
                    type="button"
                    onClick={openDemoVideosHelp}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 transition-colors cursor-pointer ${
                      darkMode ? 'hover:bg-neutral-800 text-white' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <PlayCircle className="h-4 w-4 text-emerald-500" />
                    <div>
                      <div className="font-bold">{t('nav.demoVideos', 'Demo Videos')}</div>
                      <div className="text-[10px] text-slate-400">{t('nav.demoVideosSubtitle', 'Video guides & walkthroughs')}</div>
                    </div>
                  </button>

                  {/* Option 3: Feedback */}
                  <button
                    type="button"
                    onClick={openFeedbackHelp}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 transition-colors cursor-pointer ${
                      darkMode ? 'hover:bg-neutral-800 text-white' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <MessageSquareText className="h-4 w-4 text-emerald-500" />
                    <div>
                      <div className="font-bold">{t('nav.feedback', 'Feedback')}</div>
                      <div className="text-[10px] text-slate-400">{t('nav.feedbackSubtitle', 'Share your mandi experience')}</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Link to Farmer Dashboard */}
            <Link to="/dashboard" className="ml-1">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-extrabold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs cursor-pointer"
              >
                <span>{t('landing.farmerDashboard', 'Farmer Dashboard')}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label="Toggle light/dark theme"
                className={`p-2 rounded-lg border text-xs transition-colors ${
                  darkMode
                    ? 'border-neutral-800 bg-neutral-900 text-amber-300'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg border transition-colors ${
                darkMode
                  ? 'border-neutral-800 bg-neutral-900 text-slate-200'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div
            className={`md:hidden border-t px-4 py-4 space-y-3 transition-colors ${
              darkMode ? 'bg-black border-neutral-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {/* Language Selector Row */}
            <div className="text-xs font-semibold text-slate-400 mb-1">Language / भाषा:</div>
            <div className="grid grid-cols-2 gap-2 pb-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    handleLanguageSelect(lang.code);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs text-center border font-medium transition-colors ${
                    currentLang === lang.code
                      ? darkMode
                        ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold'
                        : 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                      : darkMode
                      ? 'border-neutral-800 bg-neutral-900 text-slate-300'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  {lang.nativeName}
                </button>
              ))}
            </div>

            {/* Mobile Controls in Order */}
            <div className="pt-2 flex flex-col gap-2.5 border-t border-slate-200 dark:border-neutral-800">
              {/* Farmer Login */}
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <button
                  type="button"
                  className={`w-full py-2.5 text-xs font-bold rounded-lg border text-center ${
                    darkMode ? 'border-neutral-800 bg-neutral-900 text-slate-200' : 'border-slate-300 bg-white text-slate-800'
                  }`}
                >
                  {t('landing.farmerLogin', 'Farmer Login')}
                </button>
              </Link>

              {/* Admin Login (Mobile) */}
              <Link to="/admin/login" onClick={() => setMobileMenuOpen(false)}>
                <div
                  className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border text-xs font-bold transition-colors ${
                    darkMode
                      ? 'border-neutral-800 bg-neutral-900 text-slate-300 hover:bg-neutral-800'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t('nav.adminLogin', 'Admin Login')}</span>
                </div>
              </Link>

              {/* IVR Support Button (Mobile) */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIvrModalOpen(true);
                }}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  darkMode
                    ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <PhoneCall className="h-4 w-4 text-emerald-500" />
                <span>{t('nav.ivrSupportMobile', 'IVR Support (Toll-Free: 1800-180-1551)')}</span>
              </button>

              {/* Help & Contact Options */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openContactHelp();
                  }}
                  className={`py-2 px-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                    darkMode ? 'border-neutral-800 bg-neutral-900 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                >
                  <Mail className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{t('nav.contactUs', 'Contact Us')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openDemoVideosHelp();
                  }}
                  className={`py-2 px-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                    darkMode ? 'border-neutral-800 bg-neutral-900 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                >
                  <PlayCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{t('nav.demoVideos', 'Demo Videos')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openFeedbackHelp();
                  }}
                  className={`py-2 px-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                    darkMode ? 'border-neutral-800 bg-neutral-900 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                >
                  <MessageSquareText className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{t('nav.feedback', 'Feedback')}</span>
                </button>
              </div>

              {/* Farmer Dashboard CTA */}
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="w-full pt-1">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2"
                >
                  <span>{t('landing.farmerDashboard', 'Farmer Dashboard')}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Help Modal (Contact Us & Feedback) */}
      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        defaultTab={helpModalTab}
        darkMode={darkMode}
      />

      {/* IVR Support Modal */}
      <IvrSupportModal
        isOpen={ivrModalOpen}
        onClose={() => setIvrModalOpen(false)}
        darkMode={darkMode}
      />
    </>
  );
};
