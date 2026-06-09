import { cn } from "../../lib/utils";

interface BadgeProps {
  children: string;
  variant?: "default" | "black" | "outline";
  className?: string;
}

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
        variant === "default" && "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
        variant === "black" && "bg-black text-white dark:bg-white dark:text-black",
        variant === "outline" && "border border-neutral-300 text-neutral-700 dark:border-neutral-600 dark:text-neutral-300",
        className
      )}
    >
      {children}
    </span>
  );
}
