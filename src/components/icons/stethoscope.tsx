'use client';

interface IconProps {
  className?: string;
  size?: number;
}

export default function Stethoscope({ className, size = 24 }: IconProps) {
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
      <path d="M6 5v8a4 4 0 0 0 4 4h1a4 4 0 0 0 4-4V5" />
      <path d="M6 8h3" />
      <path d="M15 8h3" />
      <path d="M15 5a3 3 0 0 1 3 3" />
      <circle cx="17" cy="18" r="2.5" />
      <path d="M15.5 18L13 16.5" />
    </svg>
  );
}
