import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  MapPin,
  Lock,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Moon,
  Sun,
  ChevronDown,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { SmartProcureLogo } from '../components/ui/SmartProcureLogo';
import { STATES_AND_DISTRICTS } from '../constants';
import { IndianState } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { LANGUAGES, SupportedLanguage, normalizeLanguage } from '../i18n';
import { getRegisterTranslations } from '../data/registerTranslations';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, isAuthenticated } = useAuth();
  const { i18n } = useTranslation();

  const [currentLang, setCurrentLang] = React.useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smartprocure_language') || localStorage.getItem('i18nextLng');
      if (saved) return normalizeLanguage(saved);
    }
    return normalizeLanguage(i18n.language);
  });
  const txt = getRegisterTranslations(currentLang);
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
    const handleCustomChange = () => {
      const saved = localStorage.getItem('smartprocure_language');
      if (saved) {
        const normalized = normalizeLanguage(saved);
        setCurrentLang(normalized);
        i18n.changeLanguage(normalized);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('smartprocure_lang_changed', handleCustomChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('smartprocure_lang_changed', handleCustomChange);
    };
  }, [i18n]);

  // Close language dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const [currentStep, setCurrentStep] = React.useState(1);
  const totalSteps = 4;
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Step 1: Basic Info
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [mobileNumber, setMobileNumber] = React.useState('');

  // Step 2: Location
  const [state, setState] = React.useState<IndianState>('Punjab');
  const [district, setDistrict] = React.useState('Ludhiana');

  // Step 3: Security
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  // Step 4: Bank Details
  const [bankAccountNumber, setBankAccountNumber] = React.useState('');
  const [ifscCode, setIfscCode] = React.useState('');
  const [bankName, setBankName] = React.useState('');
  const [accountHolderName, setAccountHolderName] = React.useState('');

  const [formError, setFormError] = React.useState<string | null>(null);

  // If already authenticated, redirect to /farmer
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/farmer', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const availableDistricts = STATES_AND_DISTRICTS[state] || [];

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (currentStep === 1) {
      if (!fullName.trim() || !email.trim() || !mobileNumber.trim()) {
        setFormError(txt.errors.basicDetailsRequired);
        return;
      }
      if (!email.includes('@') || !email.includes('.')) {
        setFormError(txt.errors.validEmailRequired);
        return;
      }
      if (!accountHolderName) {
        setAccountHolderName(fullName.trim());
      }
    } else if (currentStep === 2) {
      if (!state || !district) {
        setFormError(txt.errors.locationRequired);
        return;
      }
    } else if (currentStep === 3) {
      if (password.length < 6) {
        setFormError(txt.errors.passwordMinLength);
        return;
      }
      if (password !== confirmPassword) {
        setFormError(txt.errors.passwordsMismatch);
        return;
      }
    } else if (currentStep === 4) {
      if (!bankAccountNumber || !ifscCode || !accountHolderName) {
        setFormError(txt.errors.bankDetailsRequired);
        return;
      }

      setIsSubmitting(true);
      setFormError(null);

      // Perform real Supabase Auth Registration
      const res = await signUp({
        fullName: fullName.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        state,
        district,
        password,
        bankAccount: {
          accountNumber: bankAccountNumber.trim(),
          ifscCode: ifscCode.trim(),
          bankName: bankName.trim(),
          accountHolderName: accountHolderName.trim(),
        },
      });

      setIsSubmitting(false);

      if (res.success) {
        // Always navigate to OTP verification passing only the email through safe state/params
        navigate(`/verify-otp?email=${encodeURIComponent(email.trim())}`, {
          state: { email: email.trim() },
        });
      } else {
        const errorMsg = res.error || txt.errors.registrationFailed;
        if (
          errorMsg.includes('Gateway') ||
          errorMsg.includes('sending confirmation email') ||
          errorMsg.includes('500') ||
          errorMsg.includes('504')
        ) {
          // If registration was hindered by SMTP delivery, redirect to verify-otp with instant verification fallback
          navigate(`/verify-otp?email=${encodeURIComponent(email.trim())}`, {
            state: { email: email.trim() },
          });
          return;
        }
        setFormError(errorMsg);
      }
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handlePrev = () => {
    setFormError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const stepLabels = [
    { title: txt.steps.step1Title, icon: User },
    { title: txt.steps.step2Title, icon: MapPin },
    { title: txt.steps.step3Title, icon: Lock },
    { title: txt.steps.step4Title, icon: CreditCard },
  ];

  return (
    <div
      className={`min-h-screen w-full relative flex flex-col justify-between py-6 sm:py-10 px-4 sm:px-6 overflow-x-hidden transition-colors duration-200 ${
        darkMode ? 'bg-black text-neutral-100' : 'bg-slate-900 text-slate-900'
      }`}
    >
      {/* FULL-PAGE USER UPLOADED BACKGROUND IMAGE WITH HIGH-LEGIBILITY OVERLAY */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/pexels-hoanggiahuy-37932519.jpg"
          alt="Lush green paddy field - Farmer Registration"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1600&auto=format&fit=crop';
          }}
        />
        <div
          className={`absolute inset-0 transition-colors duration-200 ${
            darkMode
              ? 'bg-black/85 backdrop-blur-[2px]'
              : 'bg-gradient-to-b from-black/65 via-black/45 to-black/75 backdrop-blur-[1px]'
          }`}
        />
      </div>

      {/* TOP BRAND HEADER & QUICK CONTROLS (THEME & LANGUAGE) */}
      <header className="relative z-10 w-full max-w-xl mx-auto mb-4 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <SmartProcureLogo size={40} />
          <div>
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white drop-shadow-sm">
              Smart<span className="text-emerald-400">Procure</span>
            </span>
            <span className="text-[11px] text-emerald-300 block -mt-1 font-medium hidden sm:block">
              {txt.brandSubtagline}
            </span>
          </div>
        </Link>

        {/* Quick Header Controls on Register Screen (Night / Dark Mode Toggle) */}
        <div className="flex items-center gap-2">
          {/* Night / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-lg border backdrop-blur-sm transition-colors ${
              darkMode
                ? 'border-neutral-800 bg-neutral-950/90 text-neutral-200 hover:bg-neutral-900'
                : 'border-white/30 bg-white/90 text-slate-700 hover:bg-white shadow-xs'
            }`}
            title={darkMode ? txt.theme.toggleLight : txt.theme.toggleDark}
            aria-label={darkMode ? txt.theme.toggleLight : txt.theme.toggleDark}
          >
            {darkMode ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </button>
        </div>
      </header>

      {/* MAIN FORM CONTAINER */}
      <div className="relative z-10 max-w-xl mx-auto w-full space-y-6">
        {/* Title & Subtitle */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
            {txt.portalTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 dark:text-neutral-300 max-w-md mx-auto leading-relaxed">
            {txt.portalSubtitle}
          </p>
        </div>

        {/* Multi-step progress bar */}
        <div
          className={`p-4 rounded-xl border backdrop-blur-md shadow-lg transition-colors ${
            darkMode
              ? 'bg-neutral-950/85 border-neutral-800/90'
              : 'bg-white/95 border-slate-200/80 shadow-slate-900/10'
          }`}
        >
          <div className="grid grid-cols-4 gap-2">
            {stepLabels.map((s, idx) => {
              const stepNumber = idx + 1;
              const isCompleted = currentStep > stepNumber;
              const isCurrent = currentStep === stepNumber;
              const Icon = s.icon;

              return (
                <div key={s.title} className="flex flex-col items-center text-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : isCurrent
                        ? darkMode
                          ? 'border-emerald-500 bg-emerald-950/70 text-emerald-300'
                          : 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : darkMode
                        ? 'border-neutral-800 text-neutral-400 bg-neutral-900/80'
                        : 'border-slate-200 text-slate-400 bg-white'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span
                    className={`text-[11px] font-medium mt-1.5 transition-colors ${
                      isCurrent
                        ? darkMode
                          ? 'text-emerald-300 font-bold'
                          : 'text-emerald-800 font-bold'
                        : darkMode
                        ? 'text-neutral-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            className={`mt-4 h-1.5 w-full rounded-full overflow-hidden ${
              darkMode ? 'bg-neutral-800' : 'bg-slate-100'
            }`}
          >
            <div
              className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Card */}
        <Card
          className={`backdrop-blur-md shadow-2xl transition-colors ${
            darkMode
              ? 'bg-neutral-950/90 border-neutral-800 text-neutral-100'
              : 'bg-white/95 border-slate-200/90 text-slate-900'
          }`}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  darkMode ? 'text-emerald-400' : 'text-emerald-700'
                }`}
              >
                {txt.stepOf(currentStep, totalSteps)}
              </span>
              <span className="text-xs text-slate-400 dark:text-neutral-400">
                {txt.authConnected}
              </span>
            </div>
            <CardTitle className="text-xl">
              {currentStep === 1 && txt.steps.step1Heading}
              {currentStep === 2 && txt.steps.step2Heading}
              {currentStep === 3 && txt.steps.step3Heading}
              {currentStep === 4 && txt.steps.step4Heading}
            </CardTitle>
            <CardDescription className={darkMode ? 'text-neutral-300' : 'text-slate-600'}>
              {currentStep === 1 && txt.steps.step1Desc}
              {currentStep === 2 && txt.steps.step2Desc}
              {currentStep === 3 && txt.steps.step3Desc}
              {currentStep === 4 && txt.steps.step4Desc}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleNext} className="space-y-4">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    {/* SELECT LANGUAGE BUTTON (ABOVE FULL LEGAL NAME) */}
                    <div className="relative mb-3" ref={langDropdownRef}>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
                        {txt.selectLanguage}
                      </label>
                      <button
                        type="button"
                        id="select-language-button"
                        onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                        className={`w-full group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                          darkMode
                            ? 'bg-gradient-to-r from-emerald-950/40 via-neutral-900/90 to-teal-950/30 border-emerald-500/35 text-neutral-100 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-950/60'
                            : 'bg-gradient-to-r from-emerald-50/90 via-white to-amber-50/60 border-emerald-500/40 text-slate-900 hover:border-emerald-600 hover:shadow-md hover:shadow-emerald-600/10'
                        }`}
                        aria-label={txt.selectLanguage}
                        aria-expanded={langDropdownOpen}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Minimal Suitable Logo: Agricultural Sprout with Translation Globe Rings */}
                          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 flex items-center justify-center shrink-0 shadow-sm ring-2 ring-emerald-500/30 dark:ring-emerald-400/25">
                            <svg
                              className="w-5 h-5 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="9.5" stroke="white" strokeWidth="1.5" opacity="0.35" />
                              <path d="M2.5 12h19" stroke="white" strokeWidth="1.3" opacity="0.5" />
                              <path d="M12 2.5a15 15 0 0 0 0 19" stroke="white" strokeWidth="1.5" />
                              <path d="M12 2.5a15 15 0 0 1 0 19" stroke="white" strokeWidth="1.5" />
                              <path d="M14 6C16.5 6 18 8.5 18 11C15.5 11 14 9.5 14 6Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
                            </svg>
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 border border-white dark:border-neutral-900"></span>
                            </span>
                          </div>

                          <div className="text-left min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-neutral-100">
                                {txt.selectLanguage}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/90 px-2 py-0.5 rounded-full border border-emerald-300/70 dark:border-emerald-700/60">
                                {LANGUAGES.find((l) => l.code === currentLang)?.nativeName || 'English'}
                              </span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 truncate mt-0.5">
                              {txt.selectLanguagePrompt}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 pl-2">
                          <ChevronDown
                            className={`w-4 h-4 text-slate-500 dark:text-neutral-400 transition-transform duration-200 ${
                              langDropdownOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {/* Dropdown Menu for Language Selection */}
                      {langDropdownOpen && (
                        <div
                          className={`mt-2 p-2 rounded-xl border shadow-xl backdrop-blur-md z-30 transition-all ${
                            darkMode
                              ? 'bg-neutral-950/95 border-neutral-800 text-neutral-200'
                              : 'bg-white/98 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {LANGUAGES.map((lang) => {
                              const isSelected = currentLang === lang.code;
                              return (
                                <button
                                  key={lang.code}
                                  type="button"
                                  id={`select-lang-${lang.code}`}
                                  onClick={() => handleLanguageChange(lang.code)}
                                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                                    isSelected
                                      ? darkMode
                                        ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/70 shadow-xs'
                                        : 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs'
                                      : darkMode
                                      ? 'hover:bg-neutral-900 text-neutral-300 border border-transparent'
                                      : 'hover:bg-slate-100 text-slate-700 border border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span
                                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-extrabold uppercase ${
                                        isSelected
                                          ? 'bg-emerald-600 text-white'
                                          : darkMode
                                          ? 'bg-neutral-800 text-neutral-300'
                                          : 'bg-slate-200 text-slate-700'
                                      }`}
                                    >
                                      {lang.code}
                                    </span>
                                    <div className="text-left">
                                      <span className="block text-xs font-bold leading-tight tracking-tight">
                                        {lang.nativeName}
                                      </span>
                                      <span className="block text-[10px] opacity-60 font-medium leading-tight">
                                        {lang.label}
                                      </span>
                                    </div>
                                  </div>
                                  {isSelected && <Check className="w-4 h-4 text-emerald-500 ml-2 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <Input
                      label={txt.fields.fullNameLabel}
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={txt.fields.fullNamePlaceholder}
                      helperText={txt.fields.fullNameHelper}
                    />

                    <Input
                      label={txt.fields.emailLabel}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={txt.fields.emailPlaceholder}
                      helperText={txt.fields.emailHelper}
                    />

                    <Input
                      label={txt.fields.mobileLabel}
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder={txt.fields.mobilePlaceholder}
                      helperText={txt.fields.mobileHelper}
                    />
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700 dark:text-neutral-200">
                        {txt.fields.stateLabel} <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={state}
                        onChange={(e) => {
                          const newState = e.target.value as IndianState;
                          setState(newState);
                          setDistrict(STATES_AND_DISTRICTS[newState]?.[0] || '');
                        }}
                        className="w-full h-11 px-3 py-2 rounded-lg border border-slate-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-neutral-100 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                      >
                        {Object.keys(STATES_AND_DISTRICTS).map((st) => (
                          <option
                            key={st}
                            value={st}
                            className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-neutral-100"
                          >
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700 dark:text-neutral-200">
                        {txt.fields.districtLabel} <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full h-11 px-3 py-2 rounded-lg border border-slate-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-neutral-100 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                      >
                        {availableDistricts.map((dst) => (
                          <option
                            key={dst}
                            value={dst}
                            className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-neutral-100"
                          >
                            {dst}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div
                      className={`p-3 rounded-lg border text-xs leading-relaxed transition-colors ${
                        darkMode
                          ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}
                    >
                      {txt.fields.stateNotice(state)}
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <Input
                      label={txt.fields.passwordLabel}
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={txt.fields.passwordPlaceholder}
                    />

                    <Input
                      label={txt.fields.confirmPasswordLabel}
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={txt.fields.confirmPasswordPlaceholder}
                    />
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <Input
                      label={txt.fields.accountHolderLabel}
                      required
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder={txt.fields.accountHolderPlaceholder}
                    />

                    <Input
                      label={txt.fields.bankNameLabel}
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder={txt.fields.bankNamePlaceholder}
                    />

                    <Input
                      label={txt.fields.accountNumberLabel}
                      required
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder={txt.fields.accountNumberPlaceholder}
                    />

                    <Input
                      label={txt.fields.ifscLabel}
                      required
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder={txt.fields.ifscPlaceholder}
                    />

                    <div
                      className={`p-3 rounded-lg text-[11px] flex items-center gap-2 border transition-colors ${
                        darkMode
                          ? 'bg-neutral-900/90 border-neutral-800 text-neutral-300'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{txt.fields.bankSecurityNotice}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Actions */}
              <div
                className={`pt-4 flex items-center justify-between border-t transition-colors ${
                  darkMode ? 'border-neutral-800' : 'border-slate-100'
                }`}
              >
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handlePrev}
                    disabled={isSubmitting}
                    className="gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>{txt.buttons.back}</span>
                  </Button>
                ) : (
                  <Link to="/login">
                    <Button type="button" variant="ghost" size="md">
                      {txt.buttons.existingUser}
                    </Button>
                  </Link>
                )}

                <Button
                  type="submit"
                  variant={currentStep === totalSteps ? 'orange' : 'primary'}
                  size="md"
                  isLoading={isSubmitting}
                  className="gap-2 shadow-xs font-semibold"
                >
                  <span>
                    {currentStep === totalSteps
                      ? isSubmitting
                        ? txt.buttons.registering
                        : txt.buttons.complete
                      : txt.buttons.continue}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
