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
    <div className="space-y-6">
      {searchParams.compare && (
        <div className="flex items-center justify-between rounded-lg bg-indigo-950 border border-indigo-800 px-4 py-3">
          <p className="text-sm text-indigo-300">Branch created from a previous timeline.</p>
          <Link
            href={`/compare?id1=${searchParams.compare}&id2=${params.id}`}
            className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Compare timelines &rarr;
          </Link>
        </div>
      )}
      <TimelineView timeline={timeline} />
    </div>
  );
}
