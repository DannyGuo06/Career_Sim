"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: "-0.224px",
  color: "rgba(0, 0, 0, 0.56)",
  marginBottom: 8,
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
      const result = await api.simulate({
        ambition,
        risk_tolerance: riskTolerance,
        career,
        location: location.trim(),
      });
      router.push(`/timeline/${result.id}`);
    } catch {
      setError("Simulation failed. Is the backend running?");
      setLoading(false);
    }
  }

  return (
    /* Full-height centering wrapper */
    <div
      style={{
        minHeight: "calc(100vh - 48px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{ width: "100%", maxWidth: 480 }}
      >
        {/* Hero heading — fades + slides up */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ textAlign: "center", marginBottom: 36 }}
        >
          <h1
            style={{
              fontSize: 48,
              fontWeight: 600,
              lineHeight: 1.07,
              letterSpacing: "-0.48px",
              color: "#1d1d1f",
              fontFamily: "'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif",
              margin: "0 0 12px",
            }}
          >
            Simulate Your Future
          </h1>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.47,
              letterSpacing: "-0.374px",
              color: "rgba(0, 0, 0, 0.48)",
              margin: 0,
            }}
          >
            Set your traits and career path to generate a 10-year simulation.
          </p>
        </motion.div>

        {/* Form card — fades + slides up, slightly delayed */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1], delay: 0.12 }}
          style={{
            background: "#ffffff",
            borderRadius: 20,
            padding: "32px 28px",
            boxShadow:
              "rgba(0, 0, 0, 0.08) 0px 2px 12px 0px, rgba(0, 0, 0, 0.04) 0px 0px 0px 1px",
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
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
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
        </motion.div>

        {/* Error */}
        {error && (
          <p
            style={{
              marginTop: 12,
              fontSize: 14,
              letterSpacing: "-0.224px",
              color: "#d70015",
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}

        {/* Submit button — animated */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.28 }}
          style={{ marginTop: 16 }}
        >
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={loading ? {} : { scale: 1.015, backgroundColor: "#0077ed" }}
            whileTap={loading ? {} : { scale: 0.975 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            style={{
              width: "100%",
              background: loading ? "rgba(0, 113, 227, 0.5)" : "#0071e3",
              color: "#ffffff",
              padding: "14px 20px",
              borderRadius: 8,
              fontSize: 17,
              fontWeight: 400,
              letterSpacing: "-0.374px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {loading ? "Simulating…" : "Simulate My Future"}
          </motion.button>
        </motion.div>
      </form>
    </div>
  );
}

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "-0.224px",
            color: "rgba(0,0,0,0.56)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 21,
            fontWeight: 600,
            letterSpacing: "-0.2px",
            color: "#0071e3",
            fontFamily:
              "'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif",
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
          fontSize: 12,
          letterSpacing: "-0.12px",
          color: "rgba(0,0,0,0.32)",
        }}
      >
        <span>1</span>
        <span>10</span>
      </div>
    </div>
  );
}
