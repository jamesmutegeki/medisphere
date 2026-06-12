'use client';

interface IconProps {
  className?: string;
  size?: number;
}

export default function SymptomChecker({ className, size = 24 }: IconProps) {
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
      <circle cx="12" cy="5" r="1.8" fill="currentColor" stroke="none" />
      <path d="M12 6.8v4" />
      <path d="M8.5 13.5L12 10.8l3.5 2.7" />
      <path d="M6 18l3.5-3" />
      <path d="M18 18l-3.5-3" />
      <path d="M12 10.8v8" />
      <circle cx="6" cy="17.5" r="1" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="18" cy="17.5" r="1" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="8.5" cy="13" r="1" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="15.5" cy="13" r="1" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="12" cy="19.5" r="1" fill="currentColor" stroke="none" opacity="0.6" />
    </svg>
  );
}
