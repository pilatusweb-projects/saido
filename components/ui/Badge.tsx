import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "active" | "inactive" | "live" | "closed";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "active", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-green-100 text-green-800": variant === "active" || variant === "live",
          "bg-slate-100 text-slate-600": variant === "inactive" || variant === "closed",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
