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
    desc: "Income +20%, stress spikes for 2 years, happiness −1",
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

/* ─── Shared style tokens ─── */
const CARD: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: 12,
  boxShadow: "rgba(0, 0, 0, 0.10) 0px 2px 20px 0px",
  padding: "20px 24px",
};

const LABEL_SM: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 400,
  letterSpacing: "-0.12px",
  color: "rgba(0, 0, 0, 0.40)",
  marginBottom: 3,
};

const VALUE_SM: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  letterSpacing: "-0.224px",
  color: "#1d1d1f",
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
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              lineHeight: 1.14,
              letterSpacing: "-0.2px",
              color: "#1d1d1f",
              margin: 0,
              fontFamily: "'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif",
            }}
          >
            {CAREER_LABELS[timeline.career]} Timeline
          </h1>
          <p style={{ marginTop: 6, fontSize: 14, letterSpacing: "-0.224px", color: "rgba(0,0,0,0.48)" }}>
            {timeline.location} &middot; Ambition {timeline.ambition}/10 &middot; Risk {timeline.risk_tolerance}/10
          </p>
        </div>
        {timeline.is_complete && (
          <button
            onClick={() => setShowBranchModal(true)}
            style={{
              background: "transparent",
              border: "1px solid #0066cc",
              borderRadius: 980,
              padding: "7px 16px",
              fontSize: 14,
              fontWeight: 400,
              letterSpacing: "-0.224px",
              color: "#0066cc",
              cursor: "pointer",
              transition: "background 0.15s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,102,204,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            Branch Timeline ›
          </button>
        )}
      </div>

      {/* Wallet Banner */}
      {lastYear && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            boxShadow: "rgba(0,0,0,0.10) 0px 2px 20px 0px",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", color: "rgba(0,0,0,0.38)", textTransform: "uppercase" }}>
              Wallet Balance
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: "-0.2px",
                color: "#1d1d1f",
                marginTop: 2,
                fontFamily: "'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif",
              }}
            >
              ${lastYear.wallet.toLocaleString()}
            </div>
          </div>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(52, 199, 89, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            💰
          </div>
        </div>
      )}

      {/* Year Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {timeline.years.map((y) => {
          const isActive = y.available_decisions.length > 0;
          return (
            <div
              key={y.year}
              style={{
                ...CARD,
                ...(isActive
                  ? { boxShadow: "rgba(0, 113, 227, 0.15) 0px 0px 0px 2px, rgba(0,0,0,0.08) 0px 2px 20px 0px" }
                  : {}),
              }}
            >
              {/* Top row */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: "12px 24px" }}>
                {/* Year number */}
                <div style={{ width: 48, flexShrink: 0 }}>
                  <div style={LABEL_SM}>Year</div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      letterSpacing: "-0.2px",
                      color: "#0071e3",
                      fontFamily: "'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                    }}
                  >
                    {y.year}
                  </div>
                </div>

                {/* Title */}
                <div style={{ flexShrink: 0 }}>
                  <div style={LABEL_SM}>Title</div>
                  <div style={VALUE_SM}>{y.career_title}</div>
                </div>

                {/* Income */}
                <div style={{ flexShrink: 0 }}>
                  <div style={LABEL_SM}>Income</div>
                  <div style={VALUE_SM}>${y.income.toLocaleString()}</div>
                </div>

                {/* Stat bars */}
                <StatBar label="Stress" value={y.stress} color="#ff3b30" />
                <StatBar label="Happiness" value={y.happiness} color="#34c759" />

                {/* Life event */}
                <div style={{ width: "100%", marginTop: 4 }}>
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.5,
                      letterSpacing: "-0.224px",
                      color: "rgba(0,0,0,0.56)",
                      fontStyle: "italic",
                      margin: 0,
                    }}
                  >
                    &ldquo;{y.life_event}&rdquo;
                  </p>
                </div>

                {/* Financials breakdown */}
                <div
                  style={{
                    width: "100%",
                    marginTop: 8,
                    paddingTop: 12,
                    borderTop: "1px solid rgba(0,0,0,0.06)",
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "8px 16px",
                  }}
                >
                  <FinRow label="Gross Income" value={`$${y.gross_income.toLocaleString()}`} />
                  <FinRow label="Tax (27%)" value={`−$${y.tax_paid.toLocaleString()}`} valueColor="#ff3b30" />
                  <FinRow label="Net Income" value={`$${y.net_income.toLocaleString()}`} />
                  <FinRow label="Wallet Total" value={`$${y.wallet.toLocaleString()}`} valueColor="#34c759" />
                </div>

                {/* Decision badge */}
                {y.decision && (
                  <div style={{ width: "100%" }}>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 12,
                        fontWeight: 500,
                        letterSpacing: "-0.12px",
                        color: "#0071e3",
                        background: "rgba(0,113,227,0.08)",
                        padding: "3px 10px",
                        borderRadius: 980,
                      }}
                    >
                      {DECISION_LABELS[y.decision] ?? y.decision}
                    </span>
                  </div>
                )}

                {/* Decision buttons */}
                {y.available_decisions.length > 0 && (
                  <div style={{ width: "100%", marginTop: 4 }}>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        color: "rgba(0,0,0,0.36)",
                        textTransform: "uppercase",
                        marginBottom: 10,
                      }}
                    >
                      What do you do next?
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {DECISION_OPTIONS.map((opt) => (
                        <DecisionButton
                          key={opt.value}
                          label={opt.label}
                          desc={opt.desc}
                          disabled={advancing}
                          onClick={() => handleAdvance(opt.value)}
                        />
                      ))}
                    </div>
                    {advancing && (
                      <p
                        style={{
                          marginTop: 10,
                          fontSize: 12,
                          letterSpacing: "-0.12px",
                          color: "#0071e3",
                        }}
                      >
                        Simulating Year {timeline.years.length + 1} of 10…
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Journey Complete + Chart */}
      {timeline.is_complete && lastYear && (
        <>
          <div
            style={{
              background: "#1d1d1f",
              borderRadius: 18,
              padding: "32px 28px",
              boxShadow: "rgba(0,0,0,0.22) 3px 5px 30px 0px",
            }}
          >
            <h2
              style={{
                fontSize: 21,
                fontWeight: 600,
                letterSpacing: "-0.2px",
                color: "#ffffff",
                margin: "0 0 6px",
                fontFamily: "'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif",
              }}
            >
              Journey Complete
            </h2>
            <p style={{ fontSize: 14, letterSpacing: "-0.224px", color: "rgba(255,255,255,0.56)", marginBottom: 24 }}>
              10 years simulated. Here&rsquo;s where you ended up:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
              <StatCard label="Final Title" value={lastYear.career_title} />
              <StatCard label="Final Income" value={`$${lastYear.income.toLocaleString()}`} />
              <StatCard label="Stress" value={`${lastYear.stress}/10`} />
              <StatCard label="Happiness" value={`${lastYear.happiness}/10`} />
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              boxShadow: "rgba(0,0,0,0.10) 0px 2px 20px 0px",
              padding: "20px 24px",
            }}
          >
            <h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.224px", color: "rgba(0,0,0,0.40)", marginBottom: 16, margin: "0 0 16px" }}>
              10-Year Journey
            </h2>
            <ResponsiveContainer width="100%" height={240}>
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
                <Line yAxisId="income" type="monotone" dataKey="income" name="Income ($k)" stroke="#0071e3" strokeWidth={2} dot={false} />
                <Line yAxisId="score" type="monotone" dataKey="happiness" name="Happiness" stroke="#34c759" strokeWidth={2} dot={false} />
                <Line yAxisId="score" type="monotone" dataKey="stress" name="Stress" stroke="#ff3b30" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Branch Modal */}
      {showBranchModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.50)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 24,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 18,
              padding: "32px 28px",
              width: "100%",
              maxWidth: 380,
              boxShadow: "rgba(0,0,0,0.22) 3px 5px 30px 0px",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 21,
                  fontWeight: 600,
                  letterSpacing: "-0.2px",
                  color: "#1d1d1f",
                  margin: "0 0 6px",
                  fontFamily: "'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                }}
              >
                Branch Timeline
              </h2>
              <p style={{ fontSize: 14, letterSpacing: "-0.224px", color: "rgba(0,0,0,0.48)", margin: 0 }}>
                Choose a different career to simulate an alternate path with the same traits.
              </p>
            </div>
            <select
              value={newCareer}
              onChange={(e) => setNewCareer(e.target.value)}
              style={{
                width: "100%",
                borderRadius: 11,
                background: "#fafafc",
                border: "2px solid rgba(0,0,0,0.06)",
                padding: "10px 14px",
                fontSize: 17,
                letterSpacing: "-0.374px",
                color: "#1d1d1f",
                outline: "none",
                fontFamily: "inherit",
              }}
            >
              {CAREERS.filter((c) => c.value !== timeline.career).map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowBranchModal(false)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "1px solid rgba(0,0,0,0.18)",
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontSize: 17,
                  letterSpacing: "-0.374px",
                  color: "#1d1d1f",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                Cancel
              </button>
              <button
                onClick={handleBranch}
                disabled={branching}
                style={{
                  flex: 1,
                  background: branching ? "rgba(0,113,227,0.5)" : "#0071e3",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontSize: 17,
                  letterSpacing: "-0.374px",
                  color: "#ffffff",
                  cursor: branching ? "not-allowed" : "pointer",
                  transition: "background 0.2s ease",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => { if (!branching) e.currentTarget.style.background = "#0077ed"; }}
                onMouseLeave={(e) => { if (!branching) e.currentTarget.style.background = "#0071e3"; }}
              >
                {branching ? "Branching…" : "Create Branch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DecisionButton({
  label,
  desc,
  disabled,
  onClick,
}: {
  label: string;
  desc: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: "1 1 180px",
        textAlign: "left",
        background: hovered && !disabled ? "rgba(0,113,227,0.04)" : "#fafafc",
        border: `1px solid ${hovered && !disabled ? "#0071e3" : "rgba(0,0,0,0.10)"}`,
        borderRadius: 11,
        padding: "12px 14px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "border-color 0.15s ease, background 0.15s ease",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: "-0.224px",
          color: hovered && !disabled ? "#0071e3" : "#1d1d1f",
          transition: "color 0.15s ease",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          letterSpacing: "-0.12px",
          color: "rgba(0,0,0,0.48)",
          marginTop: 3,
          lineHeight: 1.4,
        }}
      >
        {desc}
      </div>
    </button>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ flexShrink: 0, width: 112 }}>
      <div style={{ ...LABEL_SM, marginBottom: 5 }}>
        {label} {value}/10
      </div>
      <div style={{ height: 4, background: "rgba(0,0,0,0.08)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value * 10}%`, background: color, borderRadius: 2, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function FinRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div>
      <div style={LABEL_SM}>{label}</div>
      <div style={{ ...VALUE_SM, ...(valueColor ? { color: valueColor } : {}) }}>{value}</div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: "14px 16px",
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: "-0.12px", color: "rgba(255,255,255,0.48)", marginBottom: 4 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: "-0.374px",
          color: "#ffffff",
        }}
      >
        {value}
      </div>
    </div>
  );
}
