import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarPlus,
  QrCode,
  Activity,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Mail,
  Truck,
  Building2,
  UserCheck,
  PhoneCall,
  Scale,
  Sparkles,
  ArrowUpRight,
  Send,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { LiveTextTicker } from '../components/landing/LiveTextTicker';
import { HowToUseWalkthrough } from '../components/landing/HowToUseWalkthrough';

export const Home: React.FC = () => {
  const { t } = useTranslation();

  // Day / Night Theme Management
  const [darkMode, setDarkMode] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('smartprocure_theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
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

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = React.useState<number | null>(0);

  // Contact quick message state
  const [contactName, setContactName] = React.useState('');
  const [contactEmail, setContactEmail] = React.useState('');
  const [contactMessage, setContactMessage] = React.useState('');
  const [contactSent, setContactSent] = React.useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 3000);
  };

  // 6 Previous Core Points for "Why SmartProcure" with High-Impact Red, Orange, Yellow & Green Color Combinations
  const whyPoints = [
    {
      title: t('landing.whyPoint1', 'Less Waiting'),
      desc: t('landing.whyPoint1Desc', 'Eliminates overnight tractor queues. Arrive during your verified scheduled window.'),
      icon: Clock,
      stat: t('landing.whyPoint1Stat', '0 Overnight Delay'),
      iconBg: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-400/40 shadow-xs',
      statColor: 'text-red-600 dark:text-red-400',
      badge: t('landing.whyPoint1Badge', 'Immediate Gate Entry'),
      badgeClass: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40',
      cardHover: 'hover:border-red-500 dark:hover:border-red-600 hover:shadow-red-900/20'
    },
    {
      title: t('landing.whyPoint2', 'Transparent Queue'),
      desc: t('landing.whyPoint2Desc', 'Algorithmic turn allocation ensures zero favoritism or arbitrary queue jumping.'),
      icon: ShieldCheck,
      stat: t('landing.whyPoint2Stat', 'Zero Favoritism & Bias'),
      iconBg: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-400/40 shadow-xs',
      statColor: 'text-orange-600 dark:text-orange-400',
      badge: t('landing.whyPoint2Badge', 'Algorithmic Queue'),
      badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/40',
      cardHover: 'hover:border-orange-500 dark:hover:border-orange-600 hover:shadow-orange-900/20'
    },
    {
      title: t('landing.whyPoint3', 'Real-Time Updates'),
      desc: t('landing.whyPoint3Desc', 'Dynamic ETAs update automatically if weighbridge operations encounter delays.'),
      icon: Activity,
      stat: t('landing.whyPoint3Stat', 'Live Dynamic ETA'),
      iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/40 shadow-xs',
      statColor: 'text-amber-700 dark:text-amber-300',
      badge: t('landing.whyPoint3Badge', 'Live Status Alerts'),
      badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40',
      cardHover: 'hover:border-amber-500 dark:hover:border-amber-600 hover:shadow-amber-900/20'
    },
    {
      title: t('landing.whyPoint4', 'IVR Support'),
      desc: t('landing.whyPoint4Desc', 'IVR support which helps rural farmers book appointments and receive timely updates regarding procurement.'),
      icon: PhoneCall,
      stat: t('landing.whyPoint4Stat', '1800-180-1551 Toll-Free'),
      iconBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-400/40 shadow-xs',
      statColor: 'text-emerald-700 dark:text-emerald-400',
      badge: t('landing.whyPoint4Badge', '24x7 Rural Hotline'),
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
      cardHover: 'hover:border-emerald-500 dark:hover:border-emerald-600 hover:shadow-emerald-900/20'
    },
    {
      title: t('landing.whyPoint5', 'Payment Visibility'),
      desc: t('landing.whyPoint5Desc', 'End-to-end DBT bank credit tracking with instant digital receipt issuance.'),
      icon: CreditCard,
      stat: t('landing.whyPoint5Stat', '48-72h Direct DBT Credit'),
      iconBg: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-400/40 shadow-xs',
      statColor: 'text-yellow-700 dark:text-yellow-400',
      badge: t('landing.whyPoint5Badge', 'Verified Bank PFMS'),
      badgeClass: 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-300 border-yellow-500/40',
      cardHover: 'hover:border-yellow-500 dark:hover:border-yellow-600 hover:shadow-yellow-900/20'
    },
    {
      title: t('landing.whyPoint6', 'Zero Middlemen'),
      desc: t('landing.whyPoint6Desc', 'Direct farmer-to-mandi procurement eliminates unauthorized agents, illicit cuts, and unfair bias.'),
      icon: Scale,
      stat: t('landing.whyPoint6Stat', '100% Direct MSP Payout'),
      iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-400/40 shadow-xs',
      statColor: 'text-rose-600 dark:text-rose-400',
      badge: t('landing.whyPoint6Badge', 'No Middlemen Cuts'),
      badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40',
      cardHover: 'hover:border-rose-500 dark:hover:border-rose-600 hover:shadow-rose-900/20'
    },
  ];

  // 6 Major FAQ Questions
  const faqs = [
    {
      q: t('landing.faq1Q', 'How do I book an arrival slot for my crop at the mandi?'),
      a: t('landing.faq1A', 'Log in with your registered mobile number on the Farmer Portal. Select your commodity (Wheat, Paddy, Mustard, Maize), specify your expected harvest weight in quintals, and pick a convenient date and 1-hour gate arrival slot. Your encrypted QR token is generated immediately.'),
    },
    {
      q: t('landing.faq2Q', 'What happens if I reach the mandi earlier or later than my scheduled slot?'),
      a: t('landing.faq2A', 'SmartProcure provides a 30-minute grace buffer for road delays. If you arrive early, the electronic gate system queues your vehicle in the designated holding bay. If you miss your window due to emergency weather or transport breakdown, you can reschedule in 1-click without penalty.'),
    },
    {
      q: t('landing.faq3Q', 'How is the Minimum Support Price (MSP) guaranteed and protected from cuts?'),
      a: t('landing.faq3A', 'Every procurement centre runs under government agency oversight (FCI, State Civil Supplies). The official MSP rate is digitally locked in the system upon booking. Weight is captured automatically via calibrated electronic weighbridges without manual tampering, generating an official electronic J-Form.'),
    },
    {
      q: t('landing.faq4Q', 'What documents or items do I need to bring to the mandi gate?'),
      a: t('landing.faq4A', 'Bring your tractor or delivery vehicle, your digital QR Token (saved on your phone or printed SMS pass), and your Aadhaar or Kisan Passbook for fast identity verification at the express lane scanner.'),
    },
    {
      q: t('landing.faq5Q', 'When and how will my procurement payment be deposited?'),
      a: t('landing.faq5A', 'As soon as the net weight and moisture verification are approved, a digital J-Form is generated. Funds are disbursed through the Public Financial Management System (PFMS) via Direct Benefit Transfer (DBT) directly into your linked bank account within 48 to 72 hours.'),
    },
    {
      q: t('landing.faq6Q', 'Can farmers without smartphones book an appointment?'),
      a: t('landing.faq6A', 'Yes. Farmers can call our 24x7 toll-free IVR Kisan Helpline at 1800-180-1551 or visit their local Gram Panchayat / Common Service Centre (CSC) to book appointment slots and receive SMS token confirmations on basic feature phones.'),
    },
  ];

  return (
    <div
      className={`min-h-screen transition-colors duration-200 flex flex-col font-sans ${
        darkMode
          ? 'bg-black text-slate-100'
          : 'bg-[#fbfbfa] text-slate-900'
      }`}
    >
      {/* 1. TOP NAVIGATION BAR */}
      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      {/* 2. LIVE TEXT ANIMATION (Running Ticker Directly Under Header) */}
      <LiveTextTicker darkMode={darkMode} />

      <main className="grow">
        {/* 3. MAIN BANNER & MEDIA SECTION */}
        <section className="relative overflow-hidden pt-4 pb-14 sm:pt-6 sm:pb-20">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            {/* Centered Main Title with Red, Orange, Yellow Accents */}
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
              <div
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black tracking-wide mb-3 border shadow-sm ${
                  darkMode
                    ? 'bg-gradient-to-r from-red-950/70 via-orange-950/70 to-amber-950/70 text-amber-300 border-orange-500/40'
                    : 'bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 text-orange-950 border-orange-300'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="uppercase tracking-wider">{t('landing.heroBadge', 'Government Grain Procurement & Queue Automation')}</span>
              </div>

              <h1
                className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.15] mb-4 ${
                  darkMode ? 'text-white' : 'text-slate-950'
                }`}
              >
                {t('landing.heroHeadline', 'Smart Mandi Scheduling. Transparent From Arrival to Payout.')}
              </h1>

              <p
                className={`text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto font-semibold ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {t('landing.heroSubtitle', 'Skip chaotic and congested mandi queues. SmartProcure assigns guaranteed delivery windows, delivers live weighbridge updates, and ensures direct MSP settlement without middleman bias.')}
              </p>
            </div>

            {/* Image - 01: Centered Golden Maize Field Image with 2 Impactful CTA Buttons */}
            <div className="max-w-5xl mx-auto">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-orange-500/30 dark:border-neutral-800 group">
                <img
                  src="/pexels-todd-trapani-488382-1382102.jpg"
                  alt="Golden maize crop field in agricultural India"
                  className="w-full h-[380px] sm:h-[440px] md:h-[480px] object-cover transition-transform duration-700 group-hover:scale-103"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />

                {/* Dark Gradient Overlay for optimal legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />

                {/* Top Badge Overlay with Red & Yellow highlights */}
                <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600 text-white text-xs font-black tracking-wider shadow-lg border border-red-400/50">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>{t('landing.liveMandiActive', 'LIVE MANDI GATE ACTIVE')}</span>
                  </div>

                  <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-black text-slate-950 bg-amber-400 px-3.5 py-1.5 rounded-full shadow-lg border border-amber-300">
                    {t('landing.mspGuaranteed', '100% GOVT MSP GUARANTEED • DIRECT DBT')}
                  </span>
                </div>

                {/* 2 Primary CTA Buttons Inside Maize Image with Red, Orange, Yellow, Green Colors */}
                <div className="absolute bottom-6 sm:bottom-10 left-4 sm:left-8 right-4 sm:right-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  {/* CTA 1: Book Appointment */}
                  <Link to="/dashboard/book" className="w-full sm:w-auto">
                    <button
                      type="button"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-black text-sm sm:text-base text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-xl hover:shadow-2xl cursor-pointer border border-emerald-400/40"
                    >
                      <CalendarPlus className="h-5 w-5 shrink-0" />
                      <span>{t('landing.bookAppointment', 'Book Appointment')}</span>
                      <ArrowRight className="h-5 w-5 shrink-0" />
                    </button>
                  </Link>

                  {/* CTA 2: Register as New Farmer (Vibrant Saffron-Orange & Golden-Yellow) */}
                  <Link to="/register" className="w-full sm:w-auto">
                    <button
                      type="button"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-black text-sm sm:text-base text-slate-950 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 hover:from-orange-500 hover:to-amber-500 active:from-orange-600 active:to-amber-600 transition-all shadow-xl hover:shadow-2xl cursor-pointer border border-amber-300"
                    >
                      <UserCheck className="h-5 w-5 shrink-0 text-slate-950" />
                      <span>{t('landing.registerFarmer', 'Register as New Farmer')}</span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. DEDICATED "HOW TO USE IT" ANIMATED VISUAL WALKTHROUGH */}
        <HowToUseWalkthrough darkMode={darkMode} />

        {/* 5. "WHY SMARTPROCURE" - 6 Key Points with previous items & impactful red, orange, yellow colors */}
        <section
          id="why-smartprocure"
          className={`py-16 sm:py-24 border-t transition-colors duration-200 ${
            darkMode ? 'bg-black/60 border-neutral-800' : 'bg-white/80 border-emerald-100 shadow-2xs backdrop-blur-xs'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
              <span
                className={`text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full border inline-block mb-2 ${
                  darkMode
                    ? 'text-amber-300 bg-amber-950/60 border-amber-800'
                    : 'text-orange-900 bg-orange-100 border-orange-300'
                }`}
              >
                {t('landing.whyBadge', 'Key Points & Advantages')}
              </span>
              <h2
                className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mt-1 mb-3 ${
                  darkMode ? 'text-white' : 'text-slate-950'
                }`}
              >
                {t('landing.whyTitle', 'Why SmartProcure?')}
              </h2>
              <p
                className={`text-sm sm:text-base font-semibold ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {t('landing.whySubtitle', "Engineered specifically to dismantle mandi congestion, stop illegal cuts, and restore dignity to India's Annadatas.")}
              </p>
            </div>

            {/* 3x2 Grid (6 Blocks) featuring previous points with high-impact colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {whyPoints.map((b) => {
                const IconComponent = b.icon;
                const isIvrCard = b.title.includes('IVR') || b.title === t('landing.whyPoint4', 'IVR Support');
                return (
                  <div
                    key={b.title}
                    onClick={isIvrCard ? () => window.dispatchEvent(new CustomEvent('smartprocure_open_ivr')) : undefined}
                    className={`p-6 rounded-2xl border-2 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 ${
                      isIvrCard ? 'cursor-pointer group' : ''
                    } ${
                      darkMode
                        ? `bg-neutral-950/90 border-neutral-800 ${b.cardHover}`
                        : `bg-white/95 border-slate-200/90 ${b.cardHover} hover:shadow-xl`
                    }`}
                  >
                    <div>
                      {/* Top Row: Icon Badge & Status Tag */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${b.iconBg}`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${b.badgeClass}`}>
                          {b.badge}
                        </span>
                      </div>

                      <h3
                        className={`text-lg font-black mb-2 ${
                          darkMode ? 'text-white' : 'text-slate-950'
                        }`}
                      >
                        {b.title}
                      </h3>
                      <p
                        className={`text-xs sm:text-sm leading-relaxed font-semibold ${
                          darkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        {b.desc}
                      </p>
                    </div>

                    <div
                      className={`pt-4 mt-5 border-t flex items-center justify-between ${
                        darkMode ? 'border-neutral-800' : 'border-slate-100'
                      }`}
                    >
                      <span className={`text-xs font-black ${b.statColor}`}>
                        {b.stat}
                      </span>
                      {isIvrCard ? (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                          {t('landing.benefit4Action', 'View Process →')}
                        </span>
                      ) : (
                        <CheckCircle2 className={`h-4 w-4 ${b.statColor}`} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. FAQ SECTION (Accordion Style) */}
        <section
          id="faq"
          className={`py-16 sm:py-24 border-t transition-colors duration-200 ${
            darkMode ? 'bg-black/80 border-neutral-800' : 'bg-[#fafaf8]/90 border-slate-200'
          }`}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span
                className={`text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full border inline-block mb-2 ${
                  darkMode
                    ? 'text-amber-300 bg-amber-950/60 border-amber-800'
                    : 'text-amber-900 bg-amber-100 border-amber-300'
                }`}
              >
                {t('landing.faqBadge', 'Got Questions?')}
              </span>
              <h2
                className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mt-1 mb-3 ${
                  darkMode ? 'text-white' : 'text-slate-950'
                }`}
              >
                {t('landing.faqTitle', 'Frequently Asked Questions')}
              </h2>
              <p
                className={`text-sm sm:text-base font-semibold ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {t('landing.faqSubtitle', 'Everything you need to know about slot booking, token passes, weighbridge protocol, and DBT payments.')}
              </p>
            </div>

            {/* Accordion List */}
            <div className="space-y-3.5">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.q}
                    className={`rounded-xl border transition-colors ${
                      darkMode
                        ? 'bg-neutral-950 border-neutral-800'
                        : 'bg-white border-slate-200 shadow-2xs'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className={`w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base cursor-pointer focus:outline-hidden ${
                        darkMode ? 'text-white' : 'text-slate-950'
                      }`}
                    >
                      <span className={isOpen ? (darkMode ? 'text-amber-400' : 'text-amber-800') : ''}>
                        {faq.q}
                      </span>
                      <div className={`shrink-0 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div
                            className={`px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm leading-relaxed border-t font-semibold ${
                              darkMode
                                ? 'border-neutral-800 text-slate-300'
                                : 'border-slate-100 text-slate-700'
                            }`}
                          >
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 7. CONTACT US & SUPPORT (Email: smartprocurementsystem@gmail.com) */}
        <section
          id="contact"
          className={`py-16 sm:py-20 border-t transition-colors duration-200 ${
            darkMode ? 'bg-black/60 border-neutral-800' : 'bg-white/90 border-slate-200'
          }`}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div
              className={`rounded-3xl border-2 p-6 sm:p-10 transition-all ${
                darkMode
                  ? 'bg-neutral-950 border-neutral-800 shadow-2xl'
                  : 'bg-gradient-to-br from-orange-50/50 via-white to-amber-50/50 border-orange-200 shadow-lg'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Left Info Column with Red and Orange accents */}
                <div className="md:col-span-6 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white flex items-center justify-center shadow-md">
                    <Mail className="h-6 w-6" />
                  </div>
                  <h3
                    className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      darkMode ? 'text-white' : 'text-slate-950'
                    }`}
                  >
                    {t('landing.contactSupportTitle', 'Contact Support & Grievance Cell')}
                  </h3>
                  <p
                    className={`text-xs sm:text-sm font-semibold leading-relaxed ${
                      darkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    {t('landing.contactSupportSubtitle', 'Have questions about procurement slots, weighbridge calibration, or direct benefit transfer (DBT)? Reach out to our dedicated support team directly.')}
                  </p>

                  <div className="pt-2 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-extrabold text-slate-400">{t('landing.officialEmailLabel', 'Official Support Email')}</div>
                        <a
                          href="mailto:smartprocurementsystem@gmail.com"
                          className="text-xs sm:text-sm font-mono font-bold text-red-600 dark:text-red-400 hover:underline"
                        >
                          smartprocurementsystem@gmail.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                        <PhoneCall className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-extrabold text-slate-400">{t('landing.tollFreeLabel', 'Toll-Free Kisan Helpline')}</div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          1800-180-1551 • 0172-2704123
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Form Column: Quick Message */}
                <div className="md:col-span-6">
                  <div
                    className={`p-5 sm:p-6 rounded-2xl border ${
                      darkMode ? 'bg-black border-neutral-800' : 'bg-white border-slate-200 shadow-md'
                    }`}
                  >
                    {contactSent ? (
                      <div className="py-8 text-center space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-500 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-6 w-6 animate-bounce" />
                        </div>
                        <h4 className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                          {t('landing.msgDispatched', 'Message Dispatched to Help Desk')}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t('landing.msgDispatchedDesc', 'We will respond to your email with mandi support instructions shortly.')}
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleContactSubmit} className="space-y-3">
                        <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-orange-500" />
                          <span>{t('landing.quickInquiry', 'Quick Mandi Inquiry')}</span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            {t('landing.yourNameLabel', 'Your Name / किसान का नाम')}
                          </label>
                          <input
                            type="text"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder={t('landing.yourNamePlaceholder', 'e.g. Gurdeep Singh')}
                            className={`w-full px-3 py-2 text-xs rounded-lg border outline-none transition-colors ${
                              darkMode
                                ? 'bg-neutral-900 border-neutral-800 text-white focus:border-orange-500'
                                : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-orange-600'
                            }`}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            {t('landing.yourEmailLabel', 'Your Email Address')}
                          </label>
                          <input
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder={t('landing.yourEmailPlaceholder', 'e.g. farmer@example.com')}
                            className={`w-full px-3 py-2 text-xs rounded-lg border outline-none transition-colors ${
                              darkMode
                                ? 'bg-neutral-900 border-neutral-800 text-white focus:border-orange-500'
                                : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-orange-600'
                            }`}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            {t('landing.queryLabel', 'Query / Message')}
                          </label>
                          <textarea
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            rows={3}
                            placeholder={t('landing.queryPlaceholder', 'Ask about weighbridge timing, token verification, or MSP...')}
                            className={`w-full p-2 text-xs rounded-lg border outline-none transition-colors ${
                              darkMode
                                ? 'bg-neutral-900 border-neutral-800 text-white focus:border-orange-500'
                                : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-orange-600'
                            }`}
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-700 hover:to-orange-700 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>{t('landing.sendMessageBtn', 'Send to smartprocurementsystem@gmail.com')}</span>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. SIH PROTOTYPE BADGE */}
        <section
          className={`py-6 border-t transition-colors duration-200 ${
            darkMode ? 'bg-black border-neutral-800' : 'bg-slate-50/80 border-slate-200'
          }`}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  {t('landing.sihPlatformTitle', 'SmartProcure National Platform')}
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('landing.sihPlatformSubtitle', 'Smart India Hackathon Prototype • Department of Food & Public Distribution')}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 dark:text-neutral-400 font-semibold">{t('landing.teamLabel', 'Team:')}</span>
                <span className="px-2.5 py-1 rounded-md font-bold tracking-wider bg-white dark:bg-neutral-900 border border-orange-300 dark:border-neutral-800 text-orange-700 dark:text-orange-400">
                  {t('landing.teamName', 'INNOVEX')}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 9. FOOTER */}
      <Footer darkMode={darkMode} />
    </div>
  );
};

