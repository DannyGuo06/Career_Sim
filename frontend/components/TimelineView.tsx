"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TimelineData, api } from "@/lib/api";

const CAREER_LABELS: Record<string, string> = {
  ib: "Investment Banking",
  swe: "Software Engineering",
  startup: "Startup Founder",
};

const CAREERS = [
  { value: "ib", label: "Investment Banking" },
  { value: "swe", label: "Software Engineering" },
  { value: "startup", label: "Startup Founder" },
];

export default function TimelineView({ timeline }: { timeline: TimelineData }) {
  const router = useRouter();
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [newCareer, setNewCareer] = useState("ib");
  const [branching, setBranching] = useState(false);

  const chartData = timeline.years.map((y) => ({
    year: `Y${y.year}`,
    income: Math.round(y.income / 1000),
    happiness: y.happiness,
    stress: y.stress,
  }));

  async function handleBranch() {
    setBranching(true);
    try {
      const result = await api.branch({ timeline_id: timeline.id, new_career: newCareer });
      router.push(`/timeline/${result.id}?compare=${timeline.id}`);
    } catch {
      alert("Branch failed.");
      setBranching(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{CAREER_LABELS[timeline.career]} Timeline</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {timeline.location} &middot; Ambition {timeline.ambition}/10 &middot; Risk {timeline.risk_tolerance}/10
          </p>
        </div>
        <button
          onClick={() => setShowBranchModal(true)}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold transition-colors"
        >
          Branch Timeline
        </button>
      </div>

      {/* Chart */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-4">10-Year Overview</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="year" tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <YAxis yAxisId="income" orientation="left" tick={{ fill: "#9ca3af", fontSize: 12 }} label={{ value: "Income ($k)", angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 11 }} />
            <YAxis yAxisId="score" orientation="right" domain={[0, 10]} tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
              labelStyle={{ color: "#e5e7eb" }}
            />
            <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
            <Line yAxisId="income" type="monotone" dataKey="income" name="Income ($k)" stroke="#6366f1" strokeWidth={2} dot={false} />
            <Line yAxisId="score" type="monotone" dataKey="happiness" name="Happiness" stroke="#34d399" strokeWidth={2} dot={false} />
            <Line yAxisId="score" type="monotone" dataKey="stress" name="Stress" stroke="#f87171" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Year Cards */}
      <div className="grid gap-3">
        {timeline.years.map((y) => (
          <div key={y.year} className="rounded-xl bg-gray-900 border border-gray-800 p-4">
            <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
              <div className="w-14 shrink-0">
                <div className="text-xs text-gray-500">Year</div>
                <div className="text-xl font-bold text-indigo-400">{y.year}</div>
              </div>
              <div className="shrink-0">
                <div className="text-xs text-gray-500">Title</div>
                <div className="text-sm font-medium">{y.career_title}</div>
              </div>
              <div className="shrink-0">
                <div className="text-xs text-gray-500">Income</div>
                <div className="text-sm font-medium">${y.income.toLocaleString()}</div>
              </div>
              <StatBar label="Stress" value={y.stress} color="bg-red-500" />
              <StatBar label="Happiness" value={y.happiness} color="bg-emerald-500" />
              <div className="w-full mt-1">
                <p className="text-sm text-gray-300 italic">&ldquo;{y.life_event}&rdquo;</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Branch Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm space-y-5">
            <h2 className="text-lg font-bold">Branch Timeline</h2>
            <p className="text-sm text-gray-400">Choose a different career to simulate an alternate path with the same traits.</p>
            <select
              value={newCareer}
              onChange={(e) => setNewCareer(e.target.value)}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CAREERS.filter((c) => c.value !== timeline.career).map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBranchModal(false)}
                className="flex-1 rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBranch}
                disabled={branching}
                className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold transition-colors"
              >
                {branching ? "Branching..." : "Create Branch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="shrink-0 w-28">
      <div className="text-xs text-gray-500 mb-1">{label} {value}/10</div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  );
}
