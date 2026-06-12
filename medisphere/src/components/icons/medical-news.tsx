'use client';

interface IconProps {
  className?: string;
  size?: number;
}

export default function MedicalNews({ className, size = 24 }: IconProps) {
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
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <line x1="3" y1="8" x2="21" y2="8" />
      <rect x="5" y="9.5" width="6" height="4" rx="0.5" />
      <line x1="13" y1="10.5" x2="19" y2="10.5" />
      <line x1="13" y1="12.5" x2="17" y2="12.5" />
      <line x1="5" y1="15" x2="19" y2="15" />
      <line x1="5" y1="17" x2="19" y2="17" />
    </svg>
  );
}
