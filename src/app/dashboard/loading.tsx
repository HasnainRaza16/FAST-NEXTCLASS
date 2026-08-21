import { SkeletonBlock } from "@/components/skeleton";

export default function DashboardHomeLoading() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonBlock className="h-28 w-full" />
      <div className="grid gap-6 sm:grid-cols-2">
        <SkeletonBlock className="h-48 w-full" />
        <SkeletonBlock className="h-48 w-full" />
      </div>
    </div>
  );
}
