'use client';

interface IconProps {
  className?: string;
  size?: number;
}

export default function AskADoctor({ className, size = 24 }: IconProps) {
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
      <path d="M17 9c0 2.2-1.8 4-4 4h-1l-3 2v-2c-1.7 0-3-1.8-3-4s1.8-4 4-4h2c2.2 0 4 1.8 4 4z" />
      <circle cx="9.5" cy="9" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="9" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="9" r="0.6" fill="currentColor" stroke="none" />
      <rect x="14" y="14.5" width="5" height="1.5" rx="0.5" transform="rotate(30 16.5 15.25)" />
      <rect x="4" y="15" width="4" height="1.2" rx="0.4" transform="rotate(-15 6 15.6)" />
    </svg>
  );
}
