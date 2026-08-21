import { SkeletonBlock } from "@/components/skeleton";

export default function CourseDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonBlock className="h-10 w-64" />
      <SkeletonBlock className="h-32 w-full" />
      <SkeletonBlock className="h-24 w-full" />
      <SkeletonBlock className="h-40 w-full" />
      <SkeletonBlock className="h-40 w-full" />
    </div>
  );
}
