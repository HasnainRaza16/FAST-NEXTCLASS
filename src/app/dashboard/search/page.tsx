import { getTimetable } from "@/lib/data";
import { SearchPanel } from "@/components/search-panel";

export default async function SearchPage() {
  const entries = await getTimetable();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Search</h1>
      <SearchPanel initialEntries={entries} />
    </div>
  );
}
