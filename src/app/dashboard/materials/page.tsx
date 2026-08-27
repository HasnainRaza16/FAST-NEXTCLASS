import Link from "next/link";
import { getMaterialsSummary } from "@/lib/materials";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { MaterialsSearch } from "@/components/materials-search";
import { PREP_CONFIG } from "@/lib/prep";
import { Layers, ChevronRight, Clock, ClipboardCheck, FileWarning, GraduationCap } from "lucide-react";

const SEMESTER_LABELS: Record<number, string> = {
  1: "First Semester",
  2: "Second Semester",
  3: "Third Semester",
  4: "Fourth Semester",
  5: "Fifth Semester",
};

const PREP_ICONS = {
  quiz: ClipboardCheck,
  mid: FileWarning,
  final: GraduationCap,
} as const;

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

      <div>
        <h2 className="mb-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400">Exam Prep</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(Object.values(PREP_CONFIG)).map((config) => {
            const Icon = PREP_ICONS[config.type];
            return (
              <Link key={config.type} href={`/dashboard/prep/${config.type}`}>
                <Card className="h-full transition-colors hover:border-neutral-400 dark:hover:border-neutral-600">
                  <CardContent className="flex flex-col gap-2 pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold">{config.label}</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{config.description}</p>
                    <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-400">
                      <Clock className="h-3.5 w-3.5" />
                      {config.durationLabel} timed session
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400">Browse by Semester</h2>
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
