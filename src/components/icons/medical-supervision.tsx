'use client';

interface IconProps {
  className?: string;
  size?: number;
}

export default function MedicalSupervision({ className, size = 24 }: IconProps) {
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
      <rect x="4" y="14" width="12" height="5" rx="1" />
      <rect x="4" y="16" width="12" height="1.5" fill="currentColor" stroke="none" />
      <circle cx="7" cy="11" r="1.5" />
      <path d="M7 12.5v4" />
      <path d="M6 14h2" />
      <path d="M16 9v10" />
      <rect x="16" y="4" width="1.5" height="7" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="14.5" y="6" width="4.5" height="1.5" rx="0.5" fill="currentColor" stroke="none" />
      <line x1="6" y1="19" x2="6" y2="21" />
      <line x1="14" y1="19" x2="14" y2="21" />
    </svg>
  );
}
