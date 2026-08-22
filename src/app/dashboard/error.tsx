"use client";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces in the browser console so it's actually diagnosable instead
    // of just disappearing into a blank screen.
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <p className="font-medium">Something went wrong loading this page.</p>
          <p className="text-sm text-neutral-500">
            This is usually temporary. Try again, or reload the app.
          </p>
          <Button onClick={reset} className="mt-2">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
