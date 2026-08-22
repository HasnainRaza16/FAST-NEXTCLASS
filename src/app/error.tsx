"use client";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-6 text-center dark:bg-black">
      <AlertTriangle className="h-8 w-8 text-amber-500" />
      <p className="font-medium">Something went wrong.</p>
      <p className="max-w-sm text-sm text-neutral-500">
        This is usually temporary. Try again, or reopen the app.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
