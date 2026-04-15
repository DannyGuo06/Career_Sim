import Link from "next/link";
import { api } from "@/lib/api";
import TimelineView from "@/components/TimelineView";

export default async function TimelinePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { compare?: string };
}) {
  const timeline = await api.getTimeline(params.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {searchParams.compare && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 10,
            boxShadow: "rgba(0,0,0,0.08) 0px 1px 12px 0px",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <p style={{ fontSize: 14, letterSpacing: "-0.224px", color: "rgba(0,0,0,0.56)", margin: 0 }}>
            Branch created from a previous timeline.
          </p>
          <Link
            href={`/compare?id1=${searchParams.compare}&id2=${params.id}`}
            style={{
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "-0.224px",
              color: "#0066cc",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Compare timelines ›
          </Link>
        </div>
      )}
      <TimelineView timeline={timeline} />
    </div>
  );
}
