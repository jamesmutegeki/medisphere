'use client';

interface IconProps {
  className?: string;
  size?: number;
}

export default function MalePatient({ className, size = 24 }: IconProps) {
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
      <circle cx="12" cy="6" r="2.2" />
      <path d="M12 8.2v5" />
      <path d="M7.5 15.5C7.5 17 9.5 18 12 18s4.5-1 4.5-2.5" />
      <path d="M8 12.5c0 .8.5 1.5 1.5 2" />
      <path d="M16 12.5c0 .8-.5 1.5-1.5 2" />
      <path d="M14.5 8.3l2 1" />
      <path d="M9.5 8.3l-2 1" />
    </svg>
  );
}
