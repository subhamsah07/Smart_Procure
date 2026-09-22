import * as React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, ArrowRight, Lock, Mail, CheckCircle2, Moon, Sun, Globe, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { SmartProcureLogo } from '../components/ui/SmartProcureLogo';
import { useAuth } from '../contexts/AuthContext';
import { LANGUAGES, SupportedLanguage, normalizeLanguage } from '../i18n';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAuthenticated, resetPassword } = useAuth();
  const { i18n } = useTranslation();

  const [currentLang, setCurrentLang] = React.useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smartprocure_language') || localStorage.getItem('i18nextLng');
      if (saved) return normalizeLanguage(saved);
    }
    return normalizeLanguage(i18n.language);
  });
  const t = React.useMemo(() => i18n.getFixedT(currentLang), [i18n, currentLang]);
  const [langDropdownOpen, setLangDropdownOpen] = React.useState(false);
  const langDropdownRef = React.useRef<HTMLDivElement>(null);

  // Sync language changes from i18n
  React.useEffect(() => {
    const onLanguageChanged = (lng: string) => {
      const normalized = normalizeLanguage(lng);
      setCurrentLang(normalized);
    };
    i18n.on('languageChanged', onLanguageChanged);
    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, [i18n]);

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Sync Night/Dark Mode state with main dashboard & local storage
  const [darkMode, setDarkMode] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smartprocure_theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Sync DOM dark class and local storage whenever theme changes
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('smartprocure_theme', 'dark');
      } catch { /* ignore */ }
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('smartprocure_theme', 'light');
      } catch { /* ignore */ }
    }
  }, [darkMode]);

  // Sync with storage events from other tabs / dashboard navigation
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'smartprocure_theme' && e.newValue) {
        setDarkMode(e.newValue === 'dark');
      }
      if (e.key === 'smartprocure_language' && e.newValue) {
        const normalized = normalizeLanguage(e.newValue);
        setCurrentLang(normalized);
        i18n.changeLanguage(normalized);
      }
    };
    const handleCustomLangChange = () => {
      const saved = localStorage.getItem('smartprocure_language');
      if (saved) {
        const normalized = normalizeLanguage(saved);
        setCurrentLang(normalized);
        i18n.changeLanguage(normalized);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('smartprocure_lang_changed', handleCustomLangChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('smartprocure_lang_changed', handleCustomLangChange);
    };
  }, [i18n]);

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  const handleLanguageChange = (code: SupportedLanguage) => {
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

  const [identifier, setIdentifier] = React.useState(''); // Registered email address or mobile no.
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isEmailUnconfirmed, setIsEmailUnconfirmed] = React.useState(false);
  const [infoMessage, setInfoMessage] = React.useState<string | null>(null);

  // If already authenticated, redirect immediately to /farmer
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/farmer';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // Read message, email, or mobile passed from registration or password reset
  React.useEffect(() => {
    if (location.state?.message) {
      setInfoMessage(location.state.message);
    }
    if (location.state?.email) {
      setIdentifier(location.state.email);
    } else if (location.state?.mobile) {
      setIdentifier(location.state.mobile);
    }
    const searchParams = new URLSearchParams(location.search);
    const emailParam = searchParams.get('email');
    const mobileParam = searchParams.get('mobile');
    if (emailParam) {
      setIdentifier(emailParam);
    } else if (mobileParam) {
      setIdentifier(mobileParam);
    }
  }, [location.state, location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsEmailUnconfirmed(false);
    setInfoMessage(null);

    const cleanInput = identifier.trim();
    if (!cleanInput || !password) {
      setError(t('auth.enterCredentialsError', 'Please enter both your registered email address or mobile no. and password.'));
      return;
    }

    setIsLoading(true);
    const result = await signIn(cleanInput, password);
    setIsLoading(false);

    if (result.success) {
      const from = (location.state as any)?.from?.pathname || '/farmer';
      navigate(from, { replace: true });
    } else {
      if (result.isEmailUnconfirmed) {
        setIsEmailUnconfirmed(true);
        setError(t('auth.emailVerificationRequired', 'Email Verification Required'));
      } else {
        setError(result.error || t('auth.authErrorTitle', 'Unable to sign in. Please verify your credentials.'));
      }
    }
  };

  const handleForgotPassword = async () => {
    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setError(t('auth.forgotPasswordPrompt', 'Please enter your registered email address or mobile no. first to receive recovery instructions.'));
      return;
    }
    setError(null);
    const res = await resetPassword(cleanInput);
    if (res.success) {
      setInfoMessage(t('auth.recoverySent', { target: cleanInput, defaultValue: `Password recovery instructions sent to ${cleanInput} (from smartprocurementsystem@gmail.com).` }));
    } else {
      setError(res.error || t('auth.recoveryFailed', 'Failed to send password recovery email.'));
    }
  };

  return (
    <div className={`min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden transition-colors duration-200 ${darkMode ? 'bg-black text-neutral-100' : 'bg-slate-900 text-slate-900'}`}>
      {/* FULL-PAGE BACKGROUND IMAGE WITH HIGH-LEGIBILITY OVERLAY */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/pexels-hson-32954665.jpg"
          alt="Agricultural grain procurement and harvest"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1600&auto=format&fit=crop";
          }}
        />
        {/* Crisp overlay for dark mode (pure black tint) and light mode (scenic atmospheric darkening) */}
        <div
          className={`absolute inset-0 transition-colors duration-200 ${
            darkMode
              ? 'bg-black/85 backdrop-blur-[2px]'
              : 'bg-gradient-to-b from-black/65 via-black/45 to-black/75 backdrop-blur-[1px]'
          }`}
        />
      </div>

      {/* TOP BRAND HEADER & QUICK CONTROLS */}
      <header className="relative z-30 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <SmartProcureLogo size={42} />
          <div>
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white drop-shadow-sm">
              Smart<span className="text-emerald-400">Procure</span>
            </span>
            <span className="text-[11px] text-emerald-300 block -mt-1 font-medium hidden sm:block">
              {t('brand.subtagline', 'National Agricultural Digital Procurement')}
            </span>
          </div>
        </Link>

        {/* Quick Header Controls for Language & Night Mode on Login Screen */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div ref={langDropdownRef} className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLangDropdownOpen((prev) => !prev);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold backdrop-blur-sm transition-colors ${
                darkMode
                  ? 'border-neutral-800 bg-neutral-950/90 text-neutral-200 hover:bg-neutral-900'
                  : 'border-white/30 bg-white/90 text-slate-800 hover:bg-white shadow-xs'
              }`}
              aria-label="Select Language"
              aria-expanded={langDropdownOpen}
            >
              <Globe className={`h-3.5 w-3.5 ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`} />
              <span>
                {LANGUAGES.find((l) => l.code === currentLang)?.nativeName || 'English'}
              </span>
              <ChevronDown className={`h-3 w-3 opacity-60 transition-transform duration-200 ${langDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {langDropdownOpen && (
              <div className={`absolute right-0 mt-2 w-36 rounded-xl border shadow-xl py-1 z-50 text-xs backdrop-blur-md ${
                darkMode ? 'border-neutral-800 bg-neutral-950 text-neutral-200' : 'border-slate-200 bg-white text-slate-700'
              }`}>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLanguageChange(lang.code);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleLanguageChange(lang.code);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                      currentLang === lang.code
                        ? darkMode
                          ? 'font-bold text-emerald-400 bg-neutral-900'
                          : 'font-bold text-emerald-700 bg-emerald-50'
                        : darkMode
                          ? 'text-neutral-300 hover:bg-neutral-900'
                          : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] opacity-60">{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Night / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-lg border backdrop-blur-sm transition-colors ${
              darkMode
                ? 'border-neutral-800 bg-neutral-950/90 text-neutral-200 hover:bg-neutral-900'
                : 'border-white/30 bg-white/90 text-slate-700 hover:bg-white shadow-xs'
            }`}
            aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>
        </div>
      </header>

      {/* CENTERED LOGIN CARD */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35 }}
          className={`w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 border transition-all ${
            darkMode
              ? 'bg-neutral-950/95 border-neutral-800 text-neutral-100 shadow-black/80'
              : 'bg-white/95 backdrop-blur-md border-white/60 text-slate-900 shadow-xl'
          }`}
        >
          <div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2.5 border ${
              darkMode
                ? 'bg-neutral-900 text-emerald-300 border-neutral-800'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>{t('auth.securityBadge', 'Supabase Auth Protected')}</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {t('auth.farmerLoginTitle', 'Farmer Login')}
            </h2>
            <p className={`text-xs sm:text-sm mt-1 ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
              {t('auth.farmerLoginSubtitle', 'Enter your registered credentials to access your procurement portal')}
            </p>
          </div>

          {infoMessage && (
            <div className={`p-3.5 rounded-lg border flex items-start gap-2.5 text-xs ${
              darkMode
                ? 'bg-neutral-900 border-neutral-800 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`} />
              <span>{infoMessage}</span>
            </div>
          )}

          {isEmailUnconfirmed && (
            <div className={`p-4 rounded-xl border space-y-3 ${
              darkMode
                ? 'bg-neutral-900 border-amber-800/80 text-amber-200'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-start gap-2.5 text-sm font-medium">
                <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{t('auth.emailVerificationRequired', 'Email Verification Required')}</p>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-amber-300/90' : 'text-amber-800'}`}>
                    {t('auth.emailVerificationDesc', {
                      email: identifier,
                      defaultValue: `Please verify your email before logging in. A 6-digit verification code was sent to ${identifier} from noreply@mail.app.supabase.io or smartprocurementsystem@gmail.com. Check Spam if missing.`
                    })}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={`w-full justify-center font-semibold text-xs ${
                  darkMode
                    ? 'bg-neutral-950 border-amber-700/60 text-amber-300 hover:bg-neutral-900'
                    : 'bg-white border-amber-300 text-amber-900 hover:bg-amber-100'
                }`}
                onClick={() =>
                  navigate(`/verify-otp?email=${encodeURIComponent(identifier.trim())}`, {
                    state: { email: identifier.trim() },
                  })
                }
              >
                {t('auth.enterVerificationCode', 'Enter verification code →')}
              </Button>
            </div>
          )}

          {error && !isEmailUnconfirmed && (
            <Alert variant="destructive" title={t('auth.authErrorTitle', 'Authentication Error')}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.emailOrMobileLabel', 'Registered Email Address / Mobile No.')}
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={t('auth.emailOrMobilePlaceholder', 'farmer@example.com / 9876543210')}
              leftIcon={<Mail className="h-4 w-4" />}
              disabled={isLoading}
            />

            <div className="space-y-1">
              <Input
                label={t('auth.passwordLabel', 'Password')}
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
                leftIcon={<Lock className="h-4 w-4" />}
                disabled={isLoading}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className={`text-xs font-medium ${darkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-700 hover:underline'}`}
                >
                  {t('auth.forgotPassword', 'Forgot Password?')}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="orange"
              size="lg"
              isLoading={isLoading}
              className="w-full justify-center gap-2 text-base font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <span>{isLoading ? t('auth.signingIn', 'Signing In...') : t('auth.signInButton', 'Sign In to Portal')}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className={`pt-4 border-t text-center text-sm ${darkMode ? 'border-neutral-800 text-neutral-400' : 'border-slate-200 text-slate-600'}`}>
            <span>{t('auth.noAccountPrompt', "Don't have a registered account yet?")} </span>
            <Link to="/register" className={`font-bold ${darkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-700 hover:underline'}`}>
              {t('auth.registerAsFarmer', 'Register as Farmer')}
            </Link>
          </div>

          <div className="text-center">
            <Link to="/" className={`text-xs ${darkMode ? 'text-neutral-400 hover:text-neutral-200' : 'text-slate-500 hover:text-slate-700'}`}>
              &larr; {t('auth.backToHome', 'Back to Public Portal Home')}
            </Link>
          </div>
        </motion.div>
      </main>

      {/* FOOTER BAR */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-white/80 drop-shadow-sm px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span>{t('auth.helpline', 'Kisan Helpline: 1800-180-1551')}</span>
          <span className="opacity-40">•</span>
          <span>{t('auth.sihInitiative', 'SIH 2026 Initiative')}</span>
          <span className="opacity-40 hidden sm:inline">•</span>
          <a href="mailto:smartprocurementsystem@gmail.com" className="hover:text-emerald-300 transition-colors">
            smartprocurementsystem@gmail.com
          </a>
        </div>
      </footer>
    </div>
  );
};
export default Login;


