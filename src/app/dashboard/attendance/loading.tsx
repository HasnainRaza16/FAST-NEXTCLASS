import { SkeletonBlock } from "@/components/skeleton";

export default function AttendanceLoading() {
  return (
    <div className="flex flex-col gap-4">
      <SkeletonBlock className="h-8 w-40" />
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}
