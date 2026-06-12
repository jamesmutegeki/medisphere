'use client';

interface IconProps {
  className?: string;
  size?: number;
}

export default function ChildPatient({ className, size = 24 }: IconProps) {
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
      <circle cx="12" cy="6" r="2.8" />
      <path d="M7.5 13c0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5" />
      <path d="M8 11c.5 1 1.5 1.5 2.5 1.5" />
      <path d="M16 11c-.5 1-1.5 1.5-2.5 1.5" />
      <path d="M12 10.5v7" />
      <path d="M9.5 19c1 .5 2 .5 2.5.5s1.5 0 2.5-.5" />
    </svg>
  );
}
