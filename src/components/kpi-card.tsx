import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  variant?: "cyan" | "amber" | "emerald" | "purple";
  pulse?: boolean;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "cyan",
  pulse = false,
}: KPICardProps) {
  const colorMap = {
    cyan: {
      bgIcon: "bg-blue-50 text-blue-600",
      accent: "text-blue-600",
    },
    amber: {
      bgIcon: "bg-amber-50 text-amber-600",
      accent: "text-amber-600",
    },
    emerald: {
      bgIcon: "bg-emerald-50 text-emerald-600",
      accent: "text-emerald-600",
    },
    purple: {
      bgIcon: "bg-purple-50 text-purple-600",
      accent: "text-purple-600",
    },
  };

  const theme = colorMap[variant];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${theme.bgIcon}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </span>
        {pulse && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            Action needed
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-500 font-medium">
        {subtitle}
      </p>
    </div>
  );
}
