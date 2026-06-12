'use client';

interface IconProps {
  className?: string;
  size?: number;
}

export default function PharmacologicTreatment({ className, size = 24 }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <defs>
        <linearGradient id="bg-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#ccfbf1" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11.5" fill="url(#bg-gradient)" stroke="#94a3b8" strokeWidth="0.5" />
      <rect x="8.5" y="3" width="7" height="4" rx="1" />
      <rect x="7" y="7" width="10" height="13" rx="2" />
      <path d="M10 11.5h4" />
      <path d="M12 9.5v4" />
      <line x1="7" y1="17" x2="17" y2="17" />
      <rect x="9.5" y="18.5" width="5" height="1" rx="0.3" fill="currentColor" stroke="none" />
    </svg>
  );
}
