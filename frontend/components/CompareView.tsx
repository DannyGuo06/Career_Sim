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
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            lineHeight: 1.14,
            letterSpacing: "-0.2px",
            color: "#1d1d1f",
            margin: "0 0 6px",
            fontFamily: "'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif",
          }}
        >
          Timeline Comparison
        </h1>
        <p style={{ fontSize: 14, letterSpacing: "-0.224px", color: "rgba(0,0,0,0.48)", margin: 0 }}>
          {t1.location} &middot; Ambition {t1.ambition}/10 &middot; Risk {t1.risk_tolerance}/10
        </p>
      </div>

      {/* Chart */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 12,
          boxShadow: "rgba(0,0,0,0.10) 0px 2px 20px 0px",
          padding: "20px 24px",
        }}
      >
        <h2
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "-0.224px",
            color: "rgba(0,0,0,0.40)",
            margin: "0 0 16px",
          }}
        >
          Income &amp; Happiness Over 10 Years
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="year" tick={{ fill: "rgba(0,0,0,0.40)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="income" orientation="left" tick={{ fill: "rgba(0,0,0,0.40)", fontSize: 12 }} axisLine={false} tickLine={false} label={{ value: "Income ($k)", angle: -90, position: "insideLeft", fill: "rgba(0,0,0,0.32)", fontSize: 11 }} />
            <YAxis yAxisId="score" orientation="right" domain={[0, 10]} tick={{ fill: "rgba(0,0,0,0.40)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#ffffff", border: "none", borderRadius: 8, boxShadow: "rgba(0,0,0,0.14) 0px 4px 20px" }}
              labelStyle={{ color: "#1d1d1f", fontWeight: 600, fontSize: 13 }}
              itemStyle={{ fontSize: 13, color: "#1d1d1f" }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "rgba(0,0,0,0.48)" }} />
            <Line yAxisId="income" type="monotone" dataKey={`${t1Label} Income`} stroke="#0071e3" strokeWidth={2} dot={false} />
            <Line yAxisId="income" type="monotone" dataKey={`${t2Label} Income`} stroke="#0071e3" strokeWidth={2} strokeDasharray="5 3" dot={false} strokeOpacity={0.5} />
            <Line yAxisId="score" type="monotone" dataKey={`${t1Label} Happiness`} stroke="#34c759" strokeWidth={2} dot={false} />
            <Line yAxisId="score" type="monotone" dataKey={`${t2Label} Happiness`} stroke="#34c759" strokeWidth={2} strokeDasharray="5 3" dot={false} strokeOpacity={0.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Side-by-side year cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <TimelineColumn label={t1Label} timeline={t1} accentColor="#0071e3" />
        <TimelineColumn label={t2Label} timeline={t2} accentColor="#5ac8fa" />
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
  accentColor: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h2
        style={{
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: "-0.224px",
          color: accentColor,
          margin: 0,
        }}
      >
        {label}
      </h2>
      {timeline.years.map((y) => (
        <div
          key={y.year}
          style={{
            background: "#ffffff",
            borderRadius: 10,
            boxShadow: "rgba(0,0,0,0.08) 0px 1px 12px 0px",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: "-0.2px",
                color: accentColor,
                fontFamily: "'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif",
              }}
            >
              Y{y.year}
            </span>
            <span style={{ fontSize: 11, letterSpacing: "-0.12px", color: "rgba(0,0,0,0.44)" }}>
              {y.career_title}
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 12, letterSpacing: "-0.12px", color: "rgba(0,0,0,0.56)" }}>
            <span>${Math.round(y.income / 1000)}k</span>
            <span>H:{y.happiness}/10</span>
            <span>S:{y.stress}/10</span>
          </div>
          <p style={{ fontSize: 11, letterSpacing: "-0.08px", color: "rgba(0,0,0,0.40)", fontStyle: "italic", lineHeight: 1.4, margin: 0 }}>
            {y.life_event}
          </p>
        </div>
      ))}
    </div>
  );
}
