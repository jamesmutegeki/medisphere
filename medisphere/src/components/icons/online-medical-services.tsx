'use client';

interface IconProps {
  className?: string;
  size?: number;
}

export default function OnlineMedicalServices({ className, size = 24 }: IconProps) {
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
      <rect x="8" y="5" width="12" height="14" rx="1.5" />
      <circle cx="14" cy="12" r="3" strokeWidth="1.5" />
      <path d="M14 10v4" />
      <path d="M12 12h4" />
      <path d="M5 8l4 3-4 3" />
    </svg>
  );
}
