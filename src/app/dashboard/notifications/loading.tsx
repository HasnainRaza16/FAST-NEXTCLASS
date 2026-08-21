import { SkeletonBlock } from "@/components/skeleton";

export default function NotificationsLoading() {
  return (
    <div className="flex flex-col gap-3">
      <SkeletonBlock className="h-8 w-40" />
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
