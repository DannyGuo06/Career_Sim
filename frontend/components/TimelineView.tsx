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

const DECISION_OPTIONS = [
  {
    value: "promotion",
    label: "Push for Promotion",
    desc: "Income +20%, stress spikes for 2 years, happiness -1",
  },
  {
    value: "stay",
    label: "Stay the Course",
    desc: "Income +5% (standard raise), stress unchanged, happiness +1",
  },
  {
    value: "switch_company",
    label: "Switch Companies",
    desc: "Income +15%, high transition stress for 1 year, then happiness +1",
  },
];

const DECISION_LABELS: Record<string, string> = {
  promotion: "Pushed for Promotion",
  stay: "Stayed the Course",
  switch_company: "Switched Companies",
};

export default function TimelineView({ timeline: initialTimeline }: { timeline: TimelineData }) {
  const router = useRouter();
  const [timeline, setTimeline] = useState<TimelineData>(initialTimeline);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [newCareer, setNewCareer] = useState("ib");
  const [branching, setBranching] = useState(false);
  const [advancing, setAdvancing] = useState(false);

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

  async function handleAdvance(decision: string) {
    if (advancing) return;
    setAdvancing(true);
    try {
      const updated = await api.advance({ timeline_id: timeline.id, decision });
      setTimeline(updated);
    } catch (err) {
      alert(`Advance failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setAdvancing(false);
    }
  }

  const lastYear = timeline.years[timeline.years.length - 1];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{CAREER_LABELS[timeline.career]} Timeline</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {timeline.location} &middot; Ambition {timeline.ambition}/10 &middot; Risk {timeline.risk_tolerance}/10
          </p>
        </div>
        {timeline.is_complete && (
          <button
            onClick={() => setShowBranchModal(true)}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold transition-colors"
          >
            Branch Timeline
          </button>
        )}
      </div>

      {/* Wallet Banner */}
      {lastYear && (
        <div className="rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-400">Wallet</span>
          <span className="text-lg font-bold text-emerald-400">
            ${lastYear.wallet.toLocaleString()}
          </span>
        </div>
      )}

      {/* Year Cards */}
      <div className="grid gap-3">
        {timeline.years.map((y) => (
          <div
            key={y.year}
            className={`rounded-xl bg-gray-900 border p-4 ${
              y.is_locked ? "border-gray-800" : "border-indigo-800"
            }`}
          >
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
              <div className="w-full mt-2 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs border-t border-gray-800 pt-2">
                <div>
                  <div className="text-gray-500">Gross Income</div>
                  <div className="font-medium text-gray-300">${y.gross_income.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500">Tax (27%)</div>
                  <div className="font-medium text-red-400">−${y.tax_paid.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500">Net Income</div>
                  <div className="font-medium text-gray-300">${y.net_income.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500">Wallet Total</div>
                  <div className="font-medium text-emerald-400">${y.wallet.toLocaleString()}</div>
                </div>
              </div>
              {y.decision && (
                <div className="w-full">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900 border border-indigo-700 text-indigo-300 font-medium">
                    You chose: {DECISION_LABELS[y.decision] ?? y.decision}
                  </span>
                </div>
              )}
              {y.available_decisions.length > 0 && (
                <div className="w-full mt-2 space-y-2">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                    What do you do next?
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {DECISION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleAdvance(opt.value)}
                        disabled={advancing}
                        className="flex-1 text-left rounded-lg border border-gray-700 hover:border-indigo-600 hover:bg-gray-800 px-3 py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <div className="text-sm font-semibold">{opt.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                  {advancing && (
                    <p className="text-xs text-indigo-400 animate-pulse">
                      Simulating Year {timeline.years.length + 1} of 10...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Journey Complete card + Chart — revealed after Year 10 */}
      {timeline.is_complete && lastYear && (
        <>
          <div className="rounded-xl bg-gradient-to-br from-indigo-950 to-gray-900 border border-indigo-700 p-6 space-y-4">
            <h2 className="text-lg font-bold text-indigo-300">Journey Complete</h2>
            <p className="text-sm text-gray-400">10 years simulated. Here&rsquo;s where you ended up:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat label="Final Title" value={lastYear.career_title} />
              <Stat label="Final Income" value={`$${lastYear.income.toLocaleString()}`} />
              <Stat label="Stress" value={`${lastYear.stress}/10`} />
              <Stat label="Happiness" value={`${lastYear.happiness}/10`} />
            </div>
          </div>

          <div className="rounded-xl bg-gray-900 border border-gray-800 p-4">
            <h2 className="text-sm font-semibold text-gray-400 mb-4">10-Year Journey</h2>
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
        </>
      )}

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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-semibold text-white mt-0.5">{value}</div>
    </div>
  );
}
