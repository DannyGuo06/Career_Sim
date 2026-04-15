"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const CAREERS = [
  { value: "ib", label: "Investment Banking" },
  { value: "swe", label: "Software Engineering" },
  { value: "startup", label: "Startup Founder" },
];

const FIELD_STYLE: React.CSSProperties = {
  width: "100%",
  borderRadius: 11,
  background: "#fafafc",
  border: "2px solid rgba(0, 0, 0, 0.06)",
  padding: "10px 14px",
  fontSize: 17,
  letterSpacing: "-0.374px",
  color: "#1d1d1f",
  outline: "none",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  fontFamily: "inherit",
};

export default function TraitForm() {
  const router = useRouter();
  const [ambition, setAmbition] = useState(7);
  const [riskTolerance, setRiskTolerance] = useState(5);
  const [career, setCareer] = useState("swe");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!location.trim()) {
      setError("Please enter a location.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await api.simulate({ ambition, risk_tolerance: riskTolerance, career, location: location.trim() });
      router.push(`/timeline/${result.id}`);
    } catch {
      setError("Simulation failed. Is the backend running?");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 520 }}>
      {/* Hero heading */}
      <div style={{ marginBottom: 36 }}>
        <h1
          style={{
            fontSize: 40,
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.4px",
            color: "#1d1d1f",
            fontFamily: "'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif",
            margin: 0,
          }}
        >
          Simulate Your Future
        </h1>
        <p
          style={{
            marginTop: 10,
            fontSize: 17,
            lineHeight: 1.47,
            letterSpacing: "-0.374px",
            color: "rgba(0, 0, 0, 0.48)",
          }}
        >
          Set your traits and career path to generate a 10-year simulation.
        </p>
      </div>

      {/* Form card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 18,
          padding: "32px 28px",
          boxShadow: "rgba(0, 0, 0, 0.10) 0px 2px 24px 0px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        <Slider label="Ambition" value={ambition} onChange={setAmbition} />
        <Slider label="Risk Tolerance" value={riskTolerance} onChange={setRiskTolerance} />

        <div>
          <label style={labelStyle}>Career Path</label>
          <select
            value={career}
            onChange={(e) => setCareer(e.target.value)}
            style={FIELD_STYLE}
          >
            {CAREERS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Location</label>
          <input
            type="text"
            placeholder="e.g. New York City"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ ...FIELD_STYLE, color: location ? "#1d1d1f" : undefined }}
          />
        </div>
      </div>

      {error && (
        <p
          style={{
            marginTop: 12,
            fontSize: 14,
            letterSpacing: "-0.224px",
            color: "#d70015",
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: 16,
          width: "100%",
          background: loading ? "rgba(0, 113, 227, 0.5)" : "#0071e3",
          color: "#ffffff",
          padding: "13px 20px",
          borderRadius: 8,
          fontSize: 17,
          fontWeight: 400,
          letterSpacing: "-0.374px",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background 0.2s ease",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => { if (!loading) (e.currentTarget.style.background = "#0077ed"); }}
        onMouseLeave={(e) => { if (!loading) (e.currentTarget.style.background = "#0071e3"); }}
      >
        {loading ? "Simulating…" : "Simulate My Future"}
      </button>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: "-0.224px",
  color: "rgba(0, 0, 0, 0.56)",
  marginBottom: 8,
};

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.224px", color: "rgba(0,0,0,0.56)" }}>
          {label}
        </span>
        <span
          style={{
            fontSize: 21,
            fontWeight: 600,
            letterSpacing: "-0.2px",
            color: "#0071e3",
            fontFamily: "'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif",
            minWidth: 24,
            textAlign: "right",
          }}
        >
          {value}
        </span>
      </div>
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            height: 4,
            width: `${((value - 1) / 9) * 100}%`,
            background: "#0071e3",
            borderRadius: 2,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ position: "relative", zIndex: 2, background: "transparent" }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 12, letterSpacing: "-0.12px", color: "rgba(0,0,0,0.32)" }}>
        <span>1</span>
        <span>10</span>
      </div>
    </div>
  );
}
