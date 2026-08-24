import { SkeletonBlock } from "@/components/skeleton";

export default function FreeRoomsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <SkeletonBlock className="h-8 w-56" />
      <SkeletonBlock className="h-10 w-full" />
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-32 w-full" />
      ))}
    </div>
  );
}
