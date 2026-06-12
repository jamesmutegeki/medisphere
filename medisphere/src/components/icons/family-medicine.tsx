'use client';

interface IconProps {
  className?: string;
  size?: number;
}

export default function FamilyMedicine({ className, size = 24 }: IconProps) {
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
      <circle cx="17" cy="7" r="2" />
      <path d="M17 9v3.5" />
      <path d="M14.5 13.5c0 1.2 1.1 2 2.5 2s2.5-.8 2.5-2" />
      <path d="M15.5 11l3-1.5" />
      <path d="M6 7.5c0 1.5 1.3 3 3 3s3-1.5 3-3" />
      <circle cx="9" cy="6" r="1.8" />
      <path d="M9 7.8v3" />
      <path d="M6.5 16c0 1.7 1.1 2.5 2.5 2.5s2.5-.8 2.5-2.5" />
      <path d="M12 13l-2.5 2" />
    </svg>
  );
}
