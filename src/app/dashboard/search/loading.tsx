import { SkeletonBlock } from "@/components/skeleton";

export default function SearchLoading() {
  return (
    <div className="flex flex-col gap-4">
      <SkeletonBlock className="h-8 w-32" />
      <SkeletonBlock className="h-10 w-full" />
    </div>
  );
}
