import { api } from "@/lib/api";
import CompareView from "@/components/CompareView";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: { id1?: string; id2?: string };
}) {
  if (!searchParams.id1 || !searchParams.id2) {
    return (
      <div className="text-gray-400">
        Missing timeline IDs. Go simulate a path first.
      </div>
    );
  }

  const data = await api.compare(searchParams.id1, searchParams.id2);
  return <CompareView data={data} />;
}
