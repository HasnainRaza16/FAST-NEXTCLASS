import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getSemesterMaterials } from "@/lib/materials";
import { MaterialsBrowser } from "@/components/materials-browser";

const SEMESTER_LABELS: Record<number, string> = {
  1: "First Semester",
  2: "Second Semester",
  3: "Third Semester",
  4: "Fourth Semester",
  5: "Fifth Semester",
};

export function generateStaticParams() {
  return [1, 2, 3, 4, 5].map((semester) => ({ semester: String(semester) }));
}

export default async function SemesterMaterialsPage({
  params,
}: {
  params: Promise<{ semester: string }>;
}) {
  const { semester: semesterParam } = await params;
  const semester = Number(semesterParam);

  if (!Number.isInteger(semester) || semester < 1 || semester > 5) {
    notFound();
  }

  const entries = await getSemesterMaterials(semester);
  if (entries.length === 0) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/materials"
        className="flex w-fit items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        All semesters
      </Link>
      <h1 className="text-xl font-semibold">{SEMESTER_LABELS[semester] ?? `Semester ${semester}`}</h1>
      <MaterialsBrowser entries={entries} />
    </div>
  );
}
