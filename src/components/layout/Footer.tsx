import * as React from 'react';
import { Mail, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SmartProcureLogo } from '../ui/SmartProcureLogo';

export interface FooterProps {
  darkMode?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ darkMode = false }) => {
  const { t } = useTranslation();

  return (
    <footer
      className={`border-t transition-colors duration-200 py-8 px-4 sm:px-6 ${
        darkMode ? 'bg-black border-neutral-800 text-neutral-400' : 'bg-white border-slate-200 text-slate-600'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        {/* Brand & Prototype */}
        <div className="flex items-center gap-3">
          <SmartProcureLogo size={28} />
          <div className="flex items-center gap-2">
            <span className={`font-bold tracking-tight text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Smart<span className="text-emerald-600 dark:text-emerald-400">Procure</span>
            </span>
            <span className="opacity-40">•</span>
            <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t('landing.sihPrototype', 'SIH Prototype')}
            </span>
          </div>
        </div>

        {/* Team & Contact Email */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className={darkMode ? 'text-neutral-400' : 'text-slate-400'}>{t('landing.teamLabel', 'Team')}:</span>
            <span className={`font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              {t('landing.teamName', 'INNOVEX')}
            </span>
          </div>

          <span className="opacity-30 hidden sm:inline">•</span>

          <a
            href="mailto:smartprocurementsystem@gmail.com"
            className="inline-flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>smartprocurementsystem@gmail.com</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
