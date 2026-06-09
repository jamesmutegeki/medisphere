import { cn } from "../lib/utils";

interface LogoProps {
  className?: string;
  variant?: "default" | "compact";
  animated?: boolean;
}

export default function Logo({ className, variant = "default", animated = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative w-9 h-9">
        <div className={cn(
          "absolute inset-0 border-2 border-black dark:border-white rounded-lg",
          animated && "animate-logo-spin-slow"
        )} />
        <div className={cn(
          "absolute inset-1 border-2 border-black dark:border-white rounded-md rotate-45",
          animated && "animate-logo-spin"
        )} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-black dark:text-white select-none">⚖</span>
        </div>
      </div>
      {variant === "default" && (
        <div className="flex flex-col leading-tight">
          <span className="font-serif font-bold text-lg tracking-tight text-black dark:text-white">
            CCP
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 font-medium">
            Digest
          </span>
        </div>
      )}
    </div>
  );
}
