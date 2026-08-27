"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Clock, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MaterialFileRow } from "@/components/material-file-row";
import { createClient } from "@/lib/supabase/client";
import type { MaterialsSummary } from "@/lib/materials-types";
import type { MaterialEntry } from "@/lib/materials-types";
import { PREP_CONFIG } from "@/lib/prep";
import type { PrepType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PrepPickerProps {
  type: PrepType;
  summary: MaterialsSummary;
}

export function PrepPicker({ type, summary }: PrepPickerProps) {
  const config = PREP_CONFIG[type];
  const router = useRouter();
  const supabase = createClient();

  const semestersWithSubjects = useMemo(() => {
    return summary.semesters.map((sem) => {
      const subjects = sem.subjects
        .map((s) => ({
          name: s.name,
          count: s.categories.find((c) => c.name === config.primaryCategory)?.count ?? 0,
        }))
        .filter((s) => s.count > 0)
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
      return { number: sem.number, subjects };
    });
  }, [summary, config.primaryCategory]);

  const firstNonEmptySemester = semestersWithSubjects.find((s) => s.subjects.length > 0)?.number ?? 1;
  const [activeSemester, setActiveSemester] = useState(firstNonEmptySemester);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [materials, setMaterials] = useState<{ primary: MaterialEntry[]; supporting: MaterialEntry[] } | null>(null);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [showSupporting, setShowSupporting] = useState(false);
  const [starting, setStarting] = useState(false);

  const currentSubjects = semestersWithSubjects.find((s) => s.number === activeSemester)?.subjects ?? [];

  useEffect(() => {
    if (!activeSubject) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale results when the subject selection is cleared, not a derived-state loop
      setMaterials(null);
      return;
    }
    let cancelled = false;
    setLoadingMaterials(true);
    setShowSupporting(false);
    const params = new URLSearchParams({ type, semester: String(activeSemester), subject: activeSubject });
    fetch(`/api/prep/materials?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setMaterials(data);
      })
      .finally(() => {
        if (!cancelled) setLoadingMaterials(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeSubject, activeSemester, type]);

  function selectSemester(num: number) {
    setActiveSemester(num);
    setActiveSubject(null);
  }

  async function startSession() {
    if (!activeSubject) return;
    setStarting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStarting(false);
      return;
    }

    // Clean up any dangling 'active' session first — normally there won't
    // be one (leaving cancels it), but this makes starting fresh robust
    // even if a previous cleanup call never made it to the server.
    await supabase
      .from("prep_sessions")
      .update({ status: "cancelled", ended_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("status", "active");

    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.durationSeconds * 1000);

    const { data, error } = await supabase
      .from("prep_sessions")
      .insert({
        user_id: user.id,
        semester: activeSemester,
        subject: activeSubject,
        prep_type: type,
        duration_seconds: config.durationSeconds,
        status: "active",
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    setStarting(false);
    if (error || !data) {
      alert(error?.message ?? "Could not start the session — please try again.");
      return;
    }
    router.push(`/dashboard/prep/${type}/session/${data.id}`);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Semester tabs */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {semestersWithSubjects.map((sem) => (
          <button
            key={sem.number}
            type="button"
            onClick={() => selectSemester(sem.number)}
            disabled={sem.subjects.length === 0}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              sem.number === activeSemester
                ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                : "border-neutral-200 text-neutral-600 hover:border-neutral-400 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600"
            )}
          >
            Semester {sem.number}
          </button>
        ))}
      </div>

      {currentSubjects.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-400">
          No {config.primaryCategory.toLowerCase()} indexed yet for this semester.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {currentSubjects.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setActiveSubject(s.name)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                s.name === activeSubject
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-400 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600"
              )}
            >
              {s.name} <span className="opacity-60">({s.count})</span>
            </button>
          ))}
        </div>
      )}

      {activeSubject && (
        <Card>
          <CardContent className="flex flex-col gap-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold">{activeSubject}</h3>
                <p className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                  <Clock className="h-3.5 w-3.5" />
                  {config.durationLabel} timer once you start
                </p>
              </div>
              <Button onClick={startSession} disabled={starting || loadingMaterials}>
                {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {starting ? "Starting…" : "Start Timed Session"}
              </Button>
            </div>

            {loadingMaterials && <p className="text-sm text-neutral-400">Loading materials…</p>}

            {!loadingMaterials && materials && (
              <div className="flex flex-col gap-3">
                {materials.primary.length === 0 ? (
                  <p className="text-sm text-neutral-400">
                    No {config.primaryCategory.toLowerCase()} found — you can still start a timed session and use
                    the review materials below.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {materials.primary.map((m) => (
                      <MaterialFileRow key={m.rawUrl} entry={m} />
                    ))}
                  </div>
                )}

                {materials.supporting.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSupporting((v) => !v)}
                      className="flex w-fit items-center gap-1.5 text-sm font-medium text-neutral-900 dark:text-white"
                    >
                      Also review ({materials.supporting.length})
                      <ChevronDown className={cn("h-4 w-4 transition-transform", showSupporting && "rotate-180")} />
                    </button>
                    {showSupporting && (
                      <div className="flex flex-col gap-2">
                        {materials.supporting.map((m) => (
                          <MaterialFileRow key={m.rawUrl} entry={m} showCategoryBadge />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
