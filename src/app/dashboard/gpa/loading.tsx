import { SkeletonBlock } from "@/components/skeleton";

export default function GpaLoading() {
  return (
    <div className="flex flex-col gap-4">
      <SkeletonBlock className="h-8 w-48" />
      <SkeletonBlock className="h-32 w-full" />
      <SkeletonBlock className="h-56 w-full" />
    </div>
  );
}
