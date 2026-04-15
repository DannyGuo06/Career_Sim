const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface YearData {
  year: number;
  income: number;
  stress: number;
  happiness: number;
  career_title: string;
  life_event: string;
  decision: string | null;
  is_locked: boolean;
  available_decisions: string[];
}

export interface TimelineData {
  id: string;
  ambition: number;
  risk_tolerance: number;
  career: string;
  location: string;
  parent_id: string | null;
  created_at: string;
  years: YearData[];
}

export interface CompareData {
  timeline1: TimelineData;
  timeline2: TimelineData;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  simulate: (body: {
    ambition: number;
    risk_tolerance: number;
    career: string;
    location: string;
  }) => post<TimelineData>("/simulate", body),

  branch: (body: { timeline_id: string; new_career: string }) =>
    post<TimelineData>("/branch", body),

  getTimeline: (id: string) => get<TimelineData>(`/timeline/${id}`),

  compare: (id1: string, id2: string) =>
    get<CompareData>(`/compare/${id1}/${id2}`),

  decision: (body: { timeline_id: string; year: number; decision: string }) =>
    post<TimelineData>("/decision", body),
};
