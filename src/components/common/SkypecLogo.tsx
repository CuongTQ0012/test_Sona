import React from 'react';

interface SkypecLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'compact' | 'light';
}

export const SkypecLogo: React.FC<SkypecLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const dimensions = {
    sm: { width: 130, height: 58 },
    md: { width: 170, height: 75 },
    lg: { width: 220, height: 97 },
    xl: { width: 270, height: 120 },
  };

  const { width, height } = dimensions[size];

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {/* 
        Official SKYPEC Brand Identity (Vietnam Air Petro)
        Faithfully reproduced from official brand mark:
        - "Sky" in petroleum blue (#006C99)
        - "pec" in aviation gold (#F5BE2C -> #DC9907)
        - Characteristic parallel diagonal dual-stripes between "y" and "p"
        - "VIETNAM AIR PETRO" uppercase bold sans-serif subtitle in petroleum blue (#006C99)
      */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 520 230"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-2xs overflow-visible"
        aria-label="Skypec VIETNAM AIR PETRO Logo"
      >
        <defs>
          <linearGradient id="skypecBlueOfficial" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#006C99" />
            <stop offset="100%" stopColor="#005B86" />
          </linearGradient>

          <linearGradient id="skypecGoldOfficial" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F5BE2C" />
            <stop offset="50%" stopColor="#E6A817" />
            <stop offset="100%" stopColor="#DC9907" />
          </linearGradient>
        </defs>

        {/* Letter 'S' */}
        <path
          d="M 96 52 C 88 43 76 38 62 38 C 45 38 34 46 34 59 C 34 71 43 78 63 83 L 75 86 C 96 91 110 102 110 120 C 110 142 90 156 65 156 C 45 156 29 146 18 132 L 32 118 C 41 130 52 137 66 137 C 80 137 90 130 90 119 C 90 108 81 102 62 97 L 50 94 C 31 89 16 78 16 60 C 16 40 34 22 62 22 C 79 22 93 29 108 42 Z"
          fill="url(#skypecBlueOfficial)"
        />

        {/* Letter 'k' */}
        <path
          d="M 120 14 L 140 14 L 140 156 L 120 156 Z"
          fill="url(#skypecBlueOfficial)"
        />
        <path
          d="M 140 98 L 170 54 L 194 54 L 152 108 L 140 98 Z"
          fill="url(#skypecBlueOfficial)"
        />
        <path
          d="M 148 102 L 196 156 L 172 156 L 134 112 Z"
          fill="url(#skypecBlueOfficial)"
        />

        {/* Letter 'y' */}
        <path
          d="M 186 54 L 206 54 L 220 98 L 202 102 Z"
          fill="url(#skypecBlueOfficial)"
        />
        {/* Long parallel diagonal tail of 'y' */}
        <path
          d="M 235 54 L 255 54 L 202 182 L 182 182 L 210 118 L 200 94 Z"
          fill="url(#skypecBlueOfficial)"
        />

        {/* Letter 'p' */}
        {/* Long parallel diagonal stem of 'p' */}
        <path
          d="M 238 112 L 208 182 L 228 182 L 254 122 Z"
          fill="url(#skypecGoldOfficial)"
        />
        {/* Circular bowl of 'p' */}
        <path
          d="M 252 54 C 279 54 300 75 300 105 C 300 135 279 156 252 156 C 240 156 230 151 222 142 L 235 127 C 239 134 245 138 252 138 C 267 138 280 125 280 105 C 280 85 267 72 252 72 C 245 72 239 76 235 82 L 223 68 C 231 59 241 54 252 54 Z"
          fill="url(#skypecGoldOfficial)"
        />

        {/* Letter 'e' */}
        <path
          d="M 394 105 C 394 76 374 54 346 54 C 318 54 298 76 298 105 C 298 134 318 156 347 156 C 365 156 381 146 390 130 L 374 120 C 368 131 358 138 347 138 C 329 138 318 125 317 111 L 394 111 C 394 109 394 107 394 105 Z M 317 97 C 319 84 330 72 346 72 C 362 72 373 84 375 97 Z"
          fill="url(#skypecGoldOfficial)"
        />

        {/* Letter 'c' */}
        <path
          d="M 478 78 L 463 90 C 468 97 473 102 478 106 C 472 128 456 138 442 138 C 424 138 412 124 412 105 C 412 86 424 72 442 72 C 454 72 464 78 471 87 L 486 75 C 476 61 461 54 442 54 C 413 54 392 76 392 105 C 392 134 413 156 442 156 C 463 156 480 144 489 124 C 491 119 492 113 492 107 L 492 102 Z"
          fill="url(#skypecGoldOfficial)"
        />

        {/* Subtitle: VIETNAM AIR PETRO */}
        <text
          x="264"
          y="180"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
          fontSize="24"
          fontWeight="900"
          letterSpacing="0.6px"
          fill="#006C99"
        >
          VIETNAM AIR PETRO
        </text>
      </svg>
    </div>
  );
};
