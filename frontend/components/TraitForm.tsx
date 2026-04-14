"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const CAREERS = [
  { value: "ib", label: "Investment Banking" },
  { value: "swe", label: "Software Engineering" },
  { value: "startup", label: "Startup Founder" },
];

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
    <form onSubmit={handleSubmit} className="space-y-8 max-w-lg">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Simulate Your Future</h1>
        <p className="mt-2 text-gray-400 text-sm">Set your traits and career path to generate a 10-year simulation.</p>
      </div>

      <Slider label="Ambition" value={ambition} onChange={setAmbition} />
      <Slider label="Risk Tolerance" value={riskTolerance} onChange={setRiskTolerance} />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Career Path</label>
        <select
          value={career}
          onChange={(e) => setCareer(e.target.value)}
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {CAREERS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Location</label>
        <input
          type="text"
          placeholder="e.g. New York City"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 font-semibold transition-colors"
      >
        {loading ? "Simulating..." : "Simulate My Future"}
      </button>
    </form>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-indigo-400 font-bold text-lg w-6 text-right">{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-500"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>1</span>
        <span>10</span>
      </div>
    </div>
  );
}
