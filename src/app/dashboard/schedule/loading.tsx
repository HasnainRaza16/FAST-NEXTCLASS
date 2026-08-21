import { SkeletonBlock } from "@/components/skeleton";

export default function ScheduleLoading() {
  return (
    <div className="flex flex-col gap-4">
      <SkeletonBlock className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-64 w-full" />
        ))}
      </div>
    </div>
  );
}
