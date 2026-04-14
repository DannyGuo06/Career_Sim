"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { CompareData } from "@/lib/api";

const CAREER_LABELS: Record<string, string> = {
  ib: "Investment Banking",
  swe: "Software Engineering",
  startup: "Startup Founder",
};

export default function CompareView({ data }: { data: CompareData }) {
  const { timeline1: t1, timeline2: t2 } = data;

  const chartData = t1.years.map((y, i) => ({
    year: `Y${y.year}`,
    [`${CAREER_LABELS[t1.career]} Income`]: Math.round(y.income / 1000),
    [`${CAREER_LABELS[t2.career]} Income`]: Math.round(t2.years[i].income / 1000),
    [`${CAREER_LABELS[t1.career]} Happiness`]: y.happiness,
    [`${CAREER_LABELS[t2.career]} Happiness`]: t2.years[i].happiness,
  }));

  const t1Label = CAREER_LABELS[t1.career];
  const t2Label = CAREER_LABELS[t2.career];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Timeline Comparison</h1>
        <p className="text-gray-400 mt-1 text-sm">
          {t1.location} &middot; Ambition {t1.ambition}/10 &middot; Risk {t1.risk_tolerance}/10
        </p>
      </div>

      {/* Overlay Chart */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-4">Income & Happiness Over 10 Years</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="year" tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <YAxis yAxisId="income" orientation="left" tick={{ fill: "#9ca3af", fontSize: 12 }} label={{ value: "Income ($k)", angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 11 }} />
            <YAxis yAxisId="score" orientation="right" domain={[0, 10]} tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
              labelStyle={{ color: "#e5e7eb" }}
            />
            <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 11 }} />
            <Line yAxisId="income" type="monotone" dataKey={`${t1Label} Income`} stroke="#6366f1" strokeWidth={2} dot={false} />
            <Line yAxisId="income" type="monotone" dataKey={`${t2Label} Income`} stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 3" dot={false} />
            <Line yAxisId="score" type="monotone" dataKey={`${t1Label} Happiness`} stroke="#34d399" strokeWidth={2} dot={false} />
            <Line yAxisId="score" type="monotone" dataKey={`${t2Label} Happiness`} stroke="#6ee7b7" strokeWidth={2} strokeDasharray="5 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Side by side year cards */}
      <div className="grid grid-cols-2 gap-4">
        <TimelineColumn label={t1Label} timeline={t1} accentColor="indigo" />
        <TimelineColumn label={t2Label} timeline={t2} accentColor="violet" />
      </div>
    </div>
  );
}

function TimelineColumn({
  label,
  timeline,
  accentColor,
}: {
  label: string;
  timeline: CompareData["timeline1"];
  accentColor: "indigo" | "violet";
}) {
  const accent = accentColor === "indigo" ? "text-indigo-400" : "text-violet-400";
  const border = accentColor === "indigo" ? "border-indigo-800" : "border-violet-800";

  return (
    <div className="space-y-3">
      <h2 className={`text-sm font-semibold ${accent}`}>{label}</h2>
      {timeline.years.map((y) => (
        <div key={y.year} className={`rounded-lg bg-gray-900 border ${border} p-3 space-y-2`}>
          <div className="flex items-baseline gap-3">
            <span className={`text-lg font-bold ${accent}`}>Y{y.year}</span>
            <span className="text-xs text-gray-400">{y.career_title}</span>
          </div>
          <div className="flex gap-4 text-xs text-gray-300">
            <span>${Math.round(y.income / 1000)}k</span>
            <span>H:{y.happiness}/10</span>
            <span>S:{y.stress}/10</span>
          </div>
          <p className="text-xs text-gray-400 italic leading-snug">{y.life_event}</p>
        </div>
      ))}
    </div>
  );
}
