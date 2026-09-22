import * as React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { SmartProcureLogo } from '../../components/ui/SmartProcureLogo';
import { ShieldCheck, Lock, Mail, AlertCircle, Eye, EyeOff, Building2, ArrowLeft, Sun, Moon } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { adminSignIn, isAuthenticated, admin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Sync theme with localStorage / document class
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

  // If already authenticated and authorized as an admin, redirect to /admin
  React.useEffect(() => {
    if (isAuthenticated && admin) {
      const from = (location.state as any)?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, admin, navigate, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const result = await adminSignIn(email.trim(), password);

      if (result.success) {
        const from = (location.state as any)?.from?.pathname || '/admin';
        navigate(from, { replace: true });
      } else {
        setErrorMsg(result.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden font-sans antialiased transition-colors duration-200 ${
      darkMode ? 'bg-black text-neutral-100' : 'bg-slate-900 text-slate-900'
    }`}>
      {/* Top official tricolor line */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-white to-emerald-700 shadow-xs z-50" />

      {/* FULL-PAGE AGRICULTURAL FARMING BACKGROUND IMAGE */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/pexels-todd-trapani-488382-1382102.jpg"
          alt="Agricultural farmland harvest and crop cultivation"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=1600&auto=format&fit=crop";
          }}
        />
        {/* Optical overlay for pristine legibility */}
        <div
          className={`absolute inset-0 transition-colors duration-200 ${
            darkMode
              ? 'bg-black/85 backdrop-blur-[2px]'
              : 'bg-gradient-to-b from-black/75 via-black/55 to-black/80 backdrop-blur-[1px]'
          }`}
        />
      </div>

      {/* TOP HEADER & CONTROLS */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between">
        <Link
          to="/"
          id="admin-back-to-home-page"
          className="inline-flex items-center gap-2 group"
        >
          <SmartProcureLogo size={38} />
          <div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white drop-shadow-sm">
              Smart<span className="text-emerald-400">Procure</span>
            </span>
            <span className="text-[10px] sm:text-[11px] text-emerald-300 block -mt-1 font-medium">
              State Agricultural Intake Authority
            </span>
          </div>
        </Link>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm border transition-colors ${
              darkMode
                ? 'border-neutral-800 bg-neutral-950/90 text-neutral-200 hover:bg-neutral-900'
                : 'border-white/30 bg-white/90 text-slate-800 hover:bg-white shadow-xs'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Home</span>
          </Link>

          {/* Dark / Night Mode Toggle */}
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

      {/* CENTERED ADMIN LOGIN CARD */}
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
          {/* In-Card Back Link for Mobile Accessibility */}
          <div className="flex items-center justify-between sm:hidden">
            <Link
              to="/"
              id="admin-back-to-home-card"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Insignia & Header */}
          <div className="flex flex-col items-center text-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md mb-3 border ${
              darkMode
                ? 'bg-emerald-950 border-emerald-800/80 text-emerald-300'
                : 'bg-emerald-800 border-emerald-700 text-white'
            }`}>
              <Building2 className="w-7 h-7" />
            </div>

            <div className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border ${
              darkMode
                ? 'bg-neutral-900 text-emerald-300 border-neutral-800'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>State Admin Portal</span>
            </div>

            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Administrator Login
            </h1>
            <p className={`mt-1.5 text-xs sm:text-sm max-w-sm leading-relaxed ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
              Agricultural intake and mandi management authority for state procurement administrators.
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div
              id="admin-login-error"
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  darkMode ? 'text-neutral-300' : 'text-slate-700'
                }`}
              >
                Official Admin Email
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-neutral-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@procure.in"
                  className={`block w-full pl-10 pr-3.5 py-2.5 rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-600 border ${
                    darkMode
                      ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-emerald-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
                  }`}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  darkMode ? 'text-neutral-300' : 'text-slate-700'
                }`}
              >
                Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-neutral-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`block w-full pl-10 pr-10 py-2.5 rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-600 border ${
                    darkMode
                      ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-emerald-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
                  }`}
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                id="admin-signin-btn"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Sign In to Admin Console</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* 4 States as Admin */}
          <div className={`pt-5 border-t ${darkMode ? 'border-neutral-800' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between text-[11px] font-medium mb-2">
              <span className={darkMode ? 'text-neutral-400' : 'text-slate-500'}>
                Authorized State Admins
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                State Admin
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setEmail('admin.bihar@procure.in')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all cursor-pointer text-left group ${
                  email.toLowerCase().includes('bihar') || email.toLowerCase().includes('.br')
                    ? darkMode
                      ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-xs'
                      : 'bg-emerald-50/90 border-emerald-500 text-emerald-950 shadow-xs'
                    : darkMode
                    ? 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800 hover:border-emerald-600 text-neutral-200 hover:text-white'
                    : 'bg-slate-50 hover:bg-emerald-50/70 border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-900 shadow-xs'
                }`}
                title="Select Bihar State Admin"
              >
                <div>
                  <span className="font-medium group-hover:underline block">Bihar Admin</span>
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500">State Administration</span>
                </div>
                <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors flex-shrink-0 ${
                  darkMode ? 'bg-emerald-950 text-emerald-300 group-hover:bg-emerald-900' : 'bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200'
                }`}>BR</span>
              </button>

              <button
                type="button"
                onClick={() => setEmail('admin.rajasthan@procure.in')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all cursor-pointer text-left group ${
                  email.toLowerCase().includes('rajasthan') || email.toLowerCase().includes('.rj')
                    ? darkMode
                      ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-xs'
                      : 'bg-emerald-50/90 border-emerald-500 text-emerald-950 shadow-xs'
                    : darkMode
                    ? 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800 hover:border-emerald-600 text-neutral-200 hover:text-white'
                    : 'bg-slate-50 hover:bg-emerald-50/70 border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-900 shadow-xs'
                }`}
                title="Select Rajasthan State Admin"
              >
                <div>
                  <span className="font-medium group-hover:underline block">Rajasthan Admin</span>
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500">State Administration</span>
                </div>
                <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors flex-shrink-0 ${
                  darkMode ? 'bg-emerald-950 text-emerald-300 group-hover:bg-emerald-900' : 'bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200'
                }`}>RJ</span>
              </button>

              <button
                type="button"
                onClick={() => setEmail('admin.uttarpradesh@procure.in')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all cursor-pointer text-left group ${
                  email.toLowerCase().includes('uttar') || email.toLowerCase().includes('.up')
                    ? darkMode
                      ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-xs'
                      : 'bg-emerald-50/90 border-emerald-500 text-emerald-950 shadow-xs'
                    : darkMode
                    ? 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800 hover:border-emerald-600 text-neutral-200 hover:text-white'
                    : 'bg-slate-50 hover:bg-emerald-50/70 border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-900 shadow-xs'
                }`}
                title="Select Uttar Pradesh State Admin"
              >
                <div>
                  <span className="font-medium group-hover:underline block">Uttar Pradesh Admin</span>
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500">State Administration</span>
                </div>
                <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors flex-shrink-0 ${
                  darkMode ? 'bg-emerald-950 text-emerald-300 group-hover:bg-emerald-900' : 'bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200'
                }`}>UP</span>
              </button>

              <button
                type="button"
                onClick={() => setEmail('admin.westbengal@procure.in')}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all cursor-pointer text-left group ${
                  email.toLowerCase().includes('bengal') || email.toLowerCase().includes('.wb')
                    ? darkMode
                      ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-xs'
                      : 'bg-emerald-50/90 border-emerald-500 text-emerald-950 shadow-xs'
                    : darkMode
                    ? 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800 hover:border-emerald-600 text-neutral-200 hover:text-white'
                    : 'bg-slate-50 hover:bg-emerald-50/70 border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-900 shadow-xs'
                }`}
                title="Select West Bengal State Admin"
              >
                <div>
                  <span className="font-medium group-hover:underline block">West Bengal Admin</span>
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500">State Administration</span>
                </div>
                <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors flex-shrink-0 ${
                  darkMode ? 'bg-emerald-950 text-emerald-300 group-hover:bg-emerald-900' : 'bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200'
                }`}>WB</span>
              </button>
            </div>
            <p className={`mt-3 text-[10px] text-center leading-relaxed ${darkMode ? 'text-neutral-500' : 'text-slate-400'}`}>
              currently We selected only 4 state for this prototype
            </p>
          </div>
        </motion.div>
      </main>

      {/* FOOTER BAR */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-white/80 drop-shadow-sm px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span>SmartProcure Agricultural Intake Platform</span>
          <span className="opacity-40">•</span>
          <span>Official Authorized Personnel Only</span>
          <span className="opacity-40 hidden sm:inline">•</span>
          <a href="mailto:smartprocurementsystem@gmail.com" className="hover:text-emerald-300 transition-colors">
            smartprocurementsystem@gmail.com
          </a>
        </div>
      </footer>
    </div>
  );
};

