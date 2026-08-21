import { SkeletonBlock } from "@/components/skeleton";

export default function FeedbackLoading() {
  return (
    <div className="flex flex-col gap-4">
      <SkeletonBlock className="h-8 w-40" />
      <SkeletonBlock className="h-40 w-full" />
    </div>
  );
}
