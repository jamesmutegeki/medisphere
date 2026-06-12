'use client';

interface IconProps {
  className?: string;
  size?: number;
}

export default function WaitingRoom({ className, size = 24 }: IconProps) {
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
      <circle cx="17" cy="7" r="2.5" />
      <path d="M17 9.5v3" />
      <path d="M15.5 11h3" />
      <rect x="4" y="12" width="8" height="8" rx="1" />
      <line x1="4" y1="14" x2="12" y2="14" />
      <line x1="4" y1="18" x2="12" y2="18" />
      <rect x="4" y="10" width="8" height="2" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
