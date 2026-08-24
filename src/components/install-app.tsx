"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share, SquarePlus, CheckCircle2, ChevronDown } from "lucide-react";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

export function InstallApp() {
  const { canPromptInstall, promptInstall, isStandalone, platform, recentlyDismissed, dismiss } = useInstallPrompt();
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (isStandalone) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            App installed
          </CardTitle>
          <CardDescription>You&apos;re using the installed app — nice.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  async function handleInstallClick() {
    setInstalling(true);
    await promptInstall();
    setInstalling(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Install App</CardTitle>
        <CardDescription>Add NextClass to your home screen for quick, full-screen access.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {canPromptInstall && (
          <Button onClick={handleInstallClick} disabled={installing} className="w-fit">
            <Download className="h-4 w-4" />
            {installing ? "Installing…" : "Install App"}
          </Button>
        )}

        {!canPromptInstall && platform === "ios" && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowIosSteps((v) => !v)}
              className="flex w-fit items-center gap-1.5 text-sm font-medium text-neutral-900 dark:text-white"
            >
              How to install on iPhone/iPad
              <ChevronDown className={`h-4 w-4 transition-transform ${showIosSteps ? "rotate-180" : ""}`} />
            </button>
            {showIosSteps && (
              <ol className="flex flex-col gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                <li className="flex items-center gap-2">
                  <Share className="h-4 w-4 shrink-0" />
                  1. Tap the Share icon in Safari&apos;s toolbar
                </li>
                <li className="flex items-center gap-2">
                  <SquarePlus className="h-4 w-4 shrink-0" />
                  2. Tap &quot;Add to Home Screen&quot;
                </li>
                <li className="pl-6">3. Tap &quot;Add&quot; to confirm</li>
              </ol>
            )}
          </div>
        )}

        {!canPromptInstall && platform !== "ios" && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            To install, use your browser&apos;s &quot;Add to Home Screen&quot; or &quot;Install App&quot; option
            (usually in the browser menu or address bar).
          </p>
        )}

        {!canPromptInstall && recentlyDismissed && (
          <p className="text-xs text-neutral-400">You can install any time from this page.</p>
        )}

        {canPromptInstall && (
          <button type="button" onClick={dismiss} className="w-fit text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
            Not now
          </button>
        )}
      </CardContent>
    </Card>
  );
}
