import { SkeletonBlock } from "@/components/skeleton";

export default function ProfileLoading() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonBlock className="h-8 w-32" />
      <SkeletonBlock className="h-64 w-full" />
      <SkeletonBlock className="h-40 w-full" />
    </div>
  );
}
