'use client';

interface IconProps {
  className?: string;
  size?: number;
}

export default function FemalePatient({ className, size = 24 }: IconProps) {
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
      <circle cx="12" cy="6.5" r="2.5" />
      <path d="M12 9v6" />
      <path d="M8.5 12l3.5 3 3.5-3" />
      <path d="M8 17c0 1.5 1.8 2.5 4 2.5s4-1 4-2.5" />
      <path d="M12 15v4.5" />
    </svg>
  );
}
