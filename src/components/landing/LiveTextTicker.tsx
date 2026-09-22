import * as React from 'react';
import { Activity, Bell, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LiveTextTickerProps {
  darkMode?: boolean;
}

export const LiveTextTicker: React.FC<LiveTextTickerProps> = ({ darkMode = false }) => {
  const { t } = useTranslation();

  const updates = [
    {
      text: t('ticker.item1Text', 'Khanna Grain Mandi: Average Gate Wait 12 Mins'),
      highlight: t('ticker.item1Highlight', 'Live Flow'),
      icon: Activity,
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/50'
    },
    {
      text: t('ticker.item2Text', 'Official 2026 Wheat MSP: ₹2,425 / Quintal Guaranteed'),
      highlight: t('ticker.item2Highlight', 'MSP Locked'),
      icon: ShieldCheck,
      badgeColor: 'bg-amber-400 text-slate-950 font-black border-amber-300'
    },
    {
      text: t('ticker.item3Text', 'Rajpura Procurement Depot: 4 Electronic Weighbridges Active'),
      highlight: t('ticker.item3Highlight', '0 Delay'),
      icon: TrendingUp,
      badgeColor: 'bg-orange-500/30 text-orange-200 border-orange-400/50'
    },
    {
      text: t('ticker.item4Text', 'Over 2,840 Digital Tokens Dispatched Today with Zero Gate Queues'),
      highlight: t('ticker.item4Highlight', 'Express Clearance'),
      icon: Sparkles,
      badgeColor: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40'
    },
    {
      text: t('ticker.item5Text', 'Direct Benefit Transfer (DBT): Payouts Settled within 48-72 Hours to Verified Accounts'),
      highlight: t('ticker.item5Highlight', 'Direct Payout'),
      icon: ShieldCheck,
      badgeColor: 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
    },
    {
      text: t('ticker.item6Text', 'Toll-Free Kisan Help Desk: 1800-180-1551 (24x7 Multi-lingual Assistance)'),
      highlight: t('ticker.item6Highlight', '24x7 Helpline'),
      icon: Bell,
      badgeColor: 'bg-red-600/90 text-white font-bold border-red-400/60'
    }
  ];

  return (
    <div
      className={`relative w-full overflow-hidden border-b transition-colors duration-200 py-2 sm:py-2.5 z-40 ${
        darkMode
          ? 'bg-neutral-950 border-neutral-800 text-slate-200'
          : 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white border-emerald-950 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-3">
        {/* Live Badge with Red & Orange pulse */}
        <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white shadow-md border border-orange-400/40">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>{t('ticker.liveUpdates', 'Live Mandi Updates')}</span>
        </div>

        {/* Continuous Animated Ticker */}
        <div className="relative overflow-hidden w-full whitespace-nowrap mask-radial-fade">
          <div className="inline-flex items-center gap-8 animate-marquee text-xs sm:text-sm font-semibold tracking-wide">
            {updates.concat(updates).map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="inline-flex items-center gap-2.5 shrink-0">
                  <Icon className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="text-white/90">{item.text}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider border shadow-xs ${item.badgeColor}`}>
                    {item.highlight}
                  </span>
                  <span className="text-amber-400/80 font-bold ml-3">•</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
