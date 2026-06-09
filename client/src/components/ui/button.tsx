import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white disabled:opacity-50 disabled:pointer-events-none",
          variant === "primary" && "bg-black text-white hover:bg-neutral-800 shadow-md hover:shadow-lg dark:bg-white dark:text-black dark:hover:bg-neutral-200",
          variant === "secondary" && "bg-neutral-200 text-black hover:bg-neutral-300 shadow-md dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700",
          variant === "outline" && "border-2 border-black text-black hover:bg-neutral-100 dark:border-white dark:text-white dark:hover:bg-neutral-800",
          variant === "ghost" && "text-black hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-800",
          size === "sm" && "px-3 py-1.5 text-sm gap-1.5",
          size === "md" && "px-5 py-2.5 text-sm gap-2",
          size === "lg" && "px-8 py-3.5 text-base gap-2.5",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export default Button;
