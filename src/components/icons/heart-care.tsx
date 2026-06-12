'use client';

interface IconProps {
  className?: string;
  size?: number;
}

export default function HeartCare({ className, size = 24 }: IconProps) {
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
      <path d="M8 5C5 5 3 7 3 9.5 3 13 7 16 12 20c5-4 9-7 9-10.5C21 7 19 5 16 5s-4 1.5-4 3c0-1.5-1-3-4-3z" />
      <path d="M12 12.5c-1-1.5-3-1.5-4 0s0 3 4 4 4-2.5 4-4-3-1.5-4 0z" />
    </svg>
  );
}
