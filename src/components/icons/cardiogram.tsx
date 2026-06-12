'use client';

interface IconProps {
  className?: string;
  size?: number;
}

export default function Cardiogram({ className, size = 24 }: IconProps) {
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
      <path d="M12 5C9 2 4 4 4 9c0 3 2 6 8 10 6-4 8-7 8-10 0-5-5-7-8-4z" />
      <polyline points="4 10 8 10 9.5 7 11 14 12.5 9 14 12 16 10 20 10" />
    </svg>
  );
}
