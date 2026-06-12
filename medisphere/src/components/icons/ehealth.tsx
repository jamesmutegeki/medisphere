'use client';

interface IconProps {
  className?: string;
  size?: number;
}

export default function Ehealth({ className, size = 24 }: IconProps) {
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
      <rect x="3" y="5" width="18" height="12" rx="1.5" />
      <rect x="7" y="17" width="10" height="2" rx="0.5" />
      <line x1="12" y1="19" x2="12" y2="21" />
      <circle cx="12" cy="11" r="3" strokeWidth="1.8" />
      <path d="M12 9v4" />
      <path d="M10 11h4" />
      <line x1="3" y1="9" x2="3" y2="15" />
      <line x1="21" y1="9" x2="21" y2="15" />
    </svg>
  );
}
