import * as React from 'react';

interface BotanicalGrassTextureProps {
  className?: string;
  intensity?: 'subtle' | 'normal' | 'prominent';
}

/**
 * BotanicalGrassTexture:
 * A simple, minimal, and unobtrusive botanical accent for the Farmer Dashboard:
 * - Subtle ambient light-green tint in light mode
 * - Minimal, slender grass blades and wheat stalk lines in the bottom corner
 * - Clean, non-distracting, zero clutter
 */
export const BotanicalGrassTexture: React.FC<BotanicalGrassTextureProps> = ({
  className = '',
  intensity = 'subtle',
}) => {
  const strokeOpacity =
    intensity === 'subtle'
      ? 'opacity-20 dark:opacity-15'
      : intensity === 'prominent'
      ? 'opacity-40 dark:opacity-30'
      : 'opacity-30 dark:opacity-20';

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
    >
      {/* Gentle soft ambient green wash for light mode, deep calm for dark mode */}
      <div className="absolute inset-0 bg-radial from-emerald-500/[0.04] via-transparent to-transparent dark:from-emerald-950/[0.12] dark:via-transparent dark:to-transparent" />

      {/* Minimal botanical long grass lines in bottom-right corner */}
      <svg
        className={`absolute bottom-0 right-0 w-[420px] h-[520px] max-w-full pointer-events-none transition-opacity duration-500 ${strokeOpacity}`}
        viewBox="0 0 420 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="minimalGrassGradLight" x1="0" y1="520" x2="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="minimalGrassGradDark" x1="0" y1="520" x2="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <g className="dark:hidden">
          {/* Blade 1: Long graceful sweep */}
          <path
            d="M 380 520 C 360 380 320 220 230 110 C 205 78 175 52 140 30"
            stroke="url(#minimalGrassGradLight)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* Blade 2: Upright central reed */}
          <path
            d="M 340 520 C 330 360 305 210 270 95 C 260 62 245 35 220 15"
            stroke="url(#minimalGrassGradLight)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          {/* Blade 3: Arching outward blade */}
          <path
            d="M 410 520 C 390 410 375 320 340 230 C 320 175 285 130 250 90"
            stroke="url(#minimalGrassGradLight)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Blade 4: Lower gentle curve */}
          <path
            d="M 290 520 C 275 430 230 330 160 250 C 135 220 100 195 60 180"
            stroke="url(#minimalGrassGradLight)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Minimal wheat head grains on main stalk */}
          <path
            d="M 145 35 Q 140 26 132 24 M 155 48 Q 166 40 163 32 M 168 65 Q 158 55 152 52 M 180 82 Q 192 72 188 64 M 194 102 Q 182 90 178 86"
            stroke="#059669"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.75"
          />
        </g>

        <g className="hidden dark:block">
          {/* Dark mode: minimal glowing strokes */}
          <path
            d="M 380 520 C 360 380 320 220 230 110 C 205 78 175 52 140 30"
            stroke="url(#minimalGrassGradDark)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M 340 520 C 330 360 305 210 270 95 C 260 62 245 35 220 15"
            stroke="url(#minimalGrassGradDark)"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M 410 520 C 390 410 375 320 340 230 C 320 175 285 130 250 90"
            stroke="url(#minimalGrassGradDark)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M 290 520 C 275 430 230 330 160 250 C 135 220 100 195 60 180"
            stroke="url(#minimalGrassGradDark)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M 145 35 Q 140 26 132 24 M 155 48 Q 166 40 163 32 M 168 65 Q 158 55 152 52 M 180 82 Q 192 72 188 64 M 194 102 Q 182 90 178 86"
            stroke="#34d399"
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity="0.65"
          />
        </g>
      </svg>
    </div>
  );
};
