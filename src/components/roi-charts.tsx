"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Clock, TrendingUp, DollarSign, CheckCircle2 } from "lucide-react";

const hoursSavedData = [
  { day: "Mon", hoursSaved: 28, manualHoursRequired: 140 },
  { day: "Tue", hoursSaved: 42, manualHoursRequired: 210 },
  { day: "Wed", hoursSaved: 36, manualHoursRequired: 180 },
  { day: "Thu", hoursSaved: 58, manualHoursRequired: 290 },
  { day: "Fri", hoursSaved: 64, manualHoursRequired: 320 },
  { day: "Sat", hoursSaved: 48, manualHoursRequired: 240 },
  { day: "Sun", hoursSaved: 66, manualHoursRequired: 330 },
];

const resolutionDistribution = [
  { name: "Resolved by AI", value: 84, color: "#10b981" },
  { name: "Waiting Review", value: 10, color: "#6366f1" },
  { name: "Dismissed", value: 6, color: "#94a3b8" },
];

const serviceBreakdown = [
  { service: "Auth", fixed: 32, total: 36 },
  { service: "Billing", fixed: 24, total: 26 },
  { service: "API Gateway", fixed: 40, total: 44 },
  { service: "Cache", fixed: 28, total: 30 },
];

export function ROICharts() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-400 font-medium text-sm">
        Loading charts...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4 Apple-style KPI summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Fix Speed</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">45m → 1.4m</div>
            <p className="text-xs text-emerald-600 font-semibold mt-1">96.8% faster resolution</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Hours Saved</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">342 hrs</div>
            <p className="text-xs text-blue-600 font-semibold mt-1">Time given back to team</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">AI Success Rate</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">89.4%</div>
            <p className="text-xs text-indigo-600 font-semibold mt-1">Approved by engineers</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Cost Saved</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">$34,250</div>
            <p className="text-xs text-amber-600 font-semibold mt-1">Reduced downtime costs</p>
          </div>
        </div>
      </div>

      {/* Main Weekly Hours Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h4 className="text-sm font-bold text-slate-900 mb-1">
          Hours Saved This Week
        </h4>
        <p className="text-xs text-slate-500 font-medium mb-6">
          Comparing traditional manual time vs automated AI triage
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hoursSavedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="hoursSaved"
                name="Hours Saved by AI"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSaved)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Pie + Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 mb-1">
            Resolution Breakdown
          </h4>
          <p className="text-xs text-slate-500 font-medium mb-4">
            How incidents are being resolved
          </p>

          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resolutionDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {resolutionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 text-xs font-medium">
            {resolutionDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 mb-1">
            Fixes by Service
          </h4>
          <p className="text-xs text-slate-500 font-medium mb-4">
            Total incidents vs automated resolutions
          </p>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="service" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Bar dataKey="total" name="Total Incidents" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fixed" name="Resolved by AI" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
