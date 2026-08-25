import Link from "next/link";
import { getMaterialsSummary } from "@/lib/materials";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MaterialsSearch } from "@/components/materials-search";
import { Layers, ChevronRight } from "lucide-react";

const SEMESTER_LABELS: Record<number, string> = {
  1: "First Semester",
  2: "Second Semester",
  3: "Third Semester",
  4: "Fourth Semester",
  5: "Fifth Semester",
};

export default async function MaterialsPage() {
  const summary = await getMaterialsSummary();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Course Materials</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Slides, past papers, quizzes, and assignments — organized by semester and subject.
        </p>
      </div>

      <MaterialsSearch />

      <div className="grid gap-4 sm:grid-cols-2">
        {summary.semesters.map((sem) => (
          <Link key={sem.number} href={`/dashboard/materials/${sem.number}`}>
            <Card className="h-full transition-colors hover:border-neutral-400 dark:hover:border-neutral-600">
              <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>{SEMESTER_LABELS[sem.number] ?? `Semester ${sem.number}`}</CardTitle>
                    <CardDescription>
                      {sem.subjectCount} subjects · {sem.fileCount} files
                    </CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <p className="text-xs text-neutral-400">
        Sourced from the community-maintained{" "}
        <a
          href="https://github.com/FAST-NUCES-Hub/FAST-KHI-Semester-1"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-neutral-600 dark:hover:text-neutral-300"
        >
          FAST-KHI course material repositories
        </a>
        . Files open on GitHub or download straight to your device.
      </p>
    </div>
  );
}
