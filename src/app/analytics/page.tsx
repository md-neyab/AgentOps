import { ROICharts } from "@/components/roi-charts";

export default function AnalyticsPage() {
  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Analytics & Impact
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">
          See how much engineering time your AI Assistant has saved
        </p>
      </div>

      <ROICharts />
    </div>
  );
}
