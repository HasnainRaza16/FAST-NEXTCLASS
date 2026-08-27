import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock } from "lucide-react";
import { getMaterialsSummary } from "@/lib/materials";
import { PREP_CONFIG, isPrepType } from "@/lib/prep";
import { PrepPicker } from "@/components/prep-picker";

export function generateStaticParams() {
  return [{ type: "quiz" }, { type: "mid" }, { type: "final" }];
}

export default async function PrepTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!isPrepType(type)) {
    notFound();
  }

  const config = PREP_CONFIG[type];
  const summary = await getMaterialsSummary();

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/materials"
        className="flex w-fit items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        Materials
      </Link>
      <div>
        <h1 className="text-xl font-semibold">{config.label}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          <Clock className="h-4 w-4" />
          {config.durationLabel} timed session · {config.description}
        </p>
      </div>
      <PrepPicker type={type} summary={summary} />
    </div>
  );
}
