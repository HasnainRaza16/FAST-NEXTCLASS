"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, Clock, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MaterialFileRow } from "@/components/material-file-row";
import { createClient } from "@/lib/supabase/client";
import { PREP_CONFIG, formatCountdown } from "@/lib/prep";
import type { PrepSession, PrepSessionStatus } from "@/lib/types";
import type { MaterialEntry } from "@/lib/materials-types";
import { cn } from "@/lib/utils";

interface PrepSessionRunnerProps {
  session: PrepSession;
  primary: MaterialEntry[];
  supporting: MaterialEntry[];
}

export function PrepSessionRunner({ session, primary, supporting }: PrepSessionRunnerProps) {
  const config = PREP_CONFIG[session.prep_type];
  const supabase = createClient();

  const expiresAtMs = useMemo(() => new Date(session.expires_at).getTime(), [session.expires_at]);
  // Date.now() is impure, so it's read once via a lazy initializer (like
  // `remaining` below) rather than as a bare render-body computation.
  const [alreadyExpired] = useState(() => session.status === "active" && Date.now() >= expiresAtMs);

  // Tracks the outcome for this render lifetime — starts from the server's
  // view of things, but a session that expired while the tab was closed
  // (rather than one the student actively left) reads as a normal
  // completion, not a cancellation.
  const [status, setStatus] = useState<PrepSessionStatus>(alreadyExpired ? "completed" : session.status);
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000)));
  const [showSupporting, setShowSupporting] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // Guards every "mark this session as ended" path (natural timeout, Finish
  // Early, unmount cleanup, tab close) so only the first one actually wins.
  const hasEndedRef = useRef(status !== "active");

  const markEnded = useCallback(
    async (nextStatus: "completed" | "cancelled") => {
      if (hasEndedRef.current) return;
      hasEndedRef.current = true;
      await supabase
        .from("prep_sessions")
        .update({ status: nextStatus, ended_at: new Date().toISOString() })
        .eq("id", session.id)
        .eq("status", "active");
      setStatus(nextStatus);
    },
    [session.id, supabase]
  );

  // Fire-and-forget cancel for real "leaving" — closing the tab, refreshing,
  // or navigating to a different page in the app. Uses a plain keepalive
  // fetch (not the Supabase client) since a request has to reliably survive
  // the page unloading, and a component unmount's cleanup function is the
  // one place we're guaranteed to run this even for in-app navigation.
  const cancelViaBeacon = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    setStatus("cancelled");
    fetch("/api/prep/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id }),
      keepalive: true,
    }).catch(() => {});
  }, [session.id]);

  useEffect(() => {
    if (alreadyExpired) {
      // The timer genuinely ran out while nobody was here to see it —
      // that's a completion, not a punishment for leaving.
      markEnded("completed");
    }
  }, [alreadyExpired, markEnded]);

  useEffect(() => {
    if (status !== "active") return;
    const interval = setInterval(() => {
      const secondsLeft = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
      setRemaining(secondsLeft);
      if (secondsLeft <= 0) {
        markEnded("completed");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [status, expiresAtMs, markEnded]);

  useEffect(() => {
    if (status !== "active") return;
    function handleUnload() {
      cancelViaBeacon();
    }
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
      // Component unmounting mid-session means the student navigated to
      // another page in the app — that counts as leaving too.
      cancelViaBeacon();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function finishEarly() {
    setFinishing(true);
    await markEnded("completed");
    setFinishing(false);
  }

  if (status === "cancelled") {
    return (
      <EndedState
        icon={<XCircle className="h-8 w-8 text-red-500" />}
        title="Session cancelled"
        message="This session ended because you left before the timer finished. Nothing was saved — start a fresh one whenever you're ready."
        type={session.prep_type}
      />
    );
  }

  if (status === "completed") {
    return (
      <EndedState
        icon={<CheckCircle2 className="h-8 w-8 text-emerald-600" />}
        title="Session complete"
        message="Nice work. Start another subject, or head back and pick up where you left off."
        type={session.prep_type}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {config.label} · {session.subject}
          </p>
          <p className="font-mono text-5xl font-bold tabular-nums tracking-tight">{formatCountdown(remaining)}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{config.sessionCopy}</p>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Leaving this page (closing the tab, refreshing, or navigating elsewhere in the app) cancels the session.
          Opening a paper below in a new tab is fine — this page stays put.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {primary.length === 0 ? (
          <p className="text-sm text-neutral-400">
            No {config.primaryCategory.toLowerCase()} indexed for this subject — use the review materials below.
          </p>
        ) : (
          primary.map((m) => <MaterialFileRow key={m.rawUrl} entry={m} />)
        )}
      </div>

      {supporting.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowSupporting((v) => !v)}
            className="flex w-fit items-center gap-1.5 text-sm font-medium text-neutral-900 dark:text-white"
          >
            Also review ({supporting.length})
            <ChevronDown className={cn("h-4 w-4 transition-transform", showSupporting && "rotate-180")} />
          </button>
          {showSupporting && (
            <div className="flex flex-col gap-2">
              {supporting.map((m) => (
                <MaterialFileRow key={m.rawUrl} entry={m} showCategoryBadge />
              ))}
            </div>
          )}
        </div>
      )}

      <Button variant="outline" onClick={finishEarly} disabled={finishing} className="w-fit">
        {finishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
        Finish early
      </Button>
    </div>
  );
}

function EndedState({
  icon,
  title,
  message,
  type,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  type: PrepSession["prep_type"];
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">{message}</p>
        <Button asChild className="mt-2">
          <Link href={`/dashboard/prep/${type}`}>Back to {PREP_CONFIG[type].label}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
