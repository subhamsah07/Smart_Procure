import * as React from 'react';

export interface SmartProcureLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  showText?: boolean;
}

/**
 * SmartProcure Official Logo
 * Circular agricultural emblem featuring:
 * - Transparent background (no white background)
 * - Crescent protective orbit in deep emerald
 * - Golden harvest rising sun
 * - Dual crop leaves sprouting in center
 * - Contoured furrowed agricultural field terraces
 */
export const SmartProcureLogo: React.FC<SmartProcureLogoProps> = ({
  size = 40,
  className = '',
  showText = false,
  ...props
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${showText ? '' : ''}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
        aria-label="SmartProcure Logo"
        {...props}
      >
        <defs>
          {/* Sun Gradient */}
          <linearGradient id="sunGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          {/* Leaf Primary Gradient */}
          <linearGradient id="leafPrimary" x1="20%" y1="100%" x2="90%" y2="10%">
            <stop offset="0%" stopColor="#15643B" />
            <stop offset="60%" stopColor="#1E8E52" />
            <stop offset="100%" stopColor="#2BB86A" />
          </linearGradient>

          {/* Leaf Secondary Gradient */}
          <linearGradient id="leafSecondary" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#135A34" />
            <stop offset="100%" stopColor="#229858" />
          </linearGradient>

          {/* Field Top Tier Gradient */}
          <linearGradient id="fieldTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#145A32" />
            <stop offset="100%" stopColor="#1E8449" />
          </linearGradient>

          {/* Field Mid Tier Gradient */}
          <linearGradient id="fieldMid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#196F3D" />
            <stop offset="100%" stopColor="#27AE60" />
          </linearGradient>

          {/* Field Bottom Tier Gradient */}
          <linearGradient id="fieldBottom" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#114D2A" />
            <stop offset="100%" stopColor="#196F3D" />
          </linearGradient>

          {/* Outer Arc Gradient */}
          <linearGradient id="outerArc" x1="10%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#166534" />
            <stop offset="50%" stopColor="#15803D" />
            <stop offset="100%" stopColor="#14532D" />
          </linearGradient>

          {/* Drop shadow for subtle elevation */}
          <filter id="subtleGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#064E3B" floodOpacity="0.12" />
          </filter>
        </defs>

        <g filter="url(#subtleGlow)">
          {/* 1. Golden Rising Sun on Horizon */}
          <path
            d="M298 312 C298 274 330 268 355 268 C382 268 412 284 412 312 Z"
            fill="url(#sunGradient)"
          />

          {/* 2. Outer Protective Crescent Arc (From top 12 o'clock, down left, swooping underneath) */}
          <path
            d="M374 135
               C340 98 290 88 250 88
               C158 88 98 162 98 256
               C98 335 142 396 215 418
               C245 427 278 428 310 422
               C268 418 226 405 198 382
               C160 350 144 305 144 256
               C144 195 186 138 252 138
               C290 138 338 152 374 135 Z"
            fill="url(#outerArc)"
          />

          {/* 3. Center Sprouting Stem and Leaves */}
          {/* Secondary Left Leaf */}
          <path
            d="M250 312
               C244 285 230 255 204 235
               C176 214 156 215 156 215
               C156 215 168 245 185 268
               C205 295 234 310 250 312 Z"
            fill="url(#leafSecondary)"
          />

          {/* Primary Right Main Leaf */}
          <path
            d="M251 312
               C251 292 258 245 285 205
               C318 160 391 148 391 148
               C391 148 375 220 338 262
               C305 298 266 312 251 312 Z"
            fill="url(#leafPrimary)"
          />

          {/* Leaf Central Rib Line */}
          <path
            d="M253 306 Q305 242 372 165"
            stroke="#DCFCE7"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.65"
          />

          {/* 4. Furrowed Agricultural Field Mound (Terraces) */}
          {/* Top Field Tier */}
          <path
            d="M138 304
               C178 302 225 310 256 314
               C312 316 368 314 410 314
               C398 328 378 340 354 350
               C308 368 250 382 178 358
               C154 340 142 322 138 304 Z"
            fill="url(#fieldTop)"
          />

          {/* Middle Field Strip (Separated by clean white furrow boundary) */}
          <path
            d="M152 342
               C195 348 240 338 290 324
               C338 312 378 315 410 326
               C392 355 358 382 312 396
               C255 412 200 404 165 378
               C158 365 154 352 152 342 Z"
            fill="url(#fieldMid)"
          />

          {/* Bottom Field Terraced Arc */}
          <path
            d="M182 376
               C218 392 260 382 305 362
               C348 344 380 345 402 356
               C380 392 340 416 288 424
               C244 430 206 414 182 376 Z"
            fill="url(#fieldBottom)"
          />

          {/* White Furrow Curved Contour Dividers */}
          <path
            d="M156 344 C215 325 295 316 398 326"
            stroke="#FFFFFF"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M192 378 C242 358 312 342 392 356"
            stroke="#FFFFFF"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M234 408 C272 392 326 376 378 386"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
              Smart<span className="text-emerald-700">Procure</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium tracking-wide">
            Less Waiting. More Farming.
          </span>
        </div>
      )}
    </div>
  );
};
