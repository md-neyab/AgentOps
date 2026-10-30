import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "critical" | "high" | "medium" | "low" | "pending" | "approved";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-blue-50 text-blue-700 border-blue-200",
    secondary: "bg-slate-100 text-slate-700 border-slate-200",
    destructive: "bg-rose-50 text-rose-700 border-rose-200",
    outline: "text-slate-700 border-slate-200",
    critical: "bg-rose-50 text-rose-700 border border-rose-200 font-semibold",
    high: "bg-orange-50 text-orange-700 border border-orange-200 font-semibold",
    medium: "bg-amber-50 text-amber-700 border border-amber-200 font-medium",
    low: "bg-blue-50 text-blue-700 border border-blue-200 font-medium",
    pending: "bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold",
    approved: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
