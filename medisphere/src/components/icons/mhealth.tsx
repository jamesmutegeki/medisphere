'use client';

interface IconProps {
  className?: string;
  size?: number;
}

export default function Mhealth({ className, size = 24 }: IconProps) {
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
      <rect x="7" y="3" width="10" height="18" rx="1.5" />
      <circle cx="12" cy="19" r="0.8" fill="currentColor" stroke="none" />
      <path d="M9.5 8h5" />
      <path d="M9.5 10h5" />
      <path d="M9.5 12h5" />
      <line x1="7" y1="14" x2="17" y2="14" />
      <line x1="7" y1="16" x2="17" y2="16" />
    </svg>
  );
}
