"use client";
import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// How often to actively poll for a new deploy while the app stays open.
// Browsers only check for SW updates automatically on navigation, which
// doesn't happen for a PWA/tab left open in the background for a long
// session — so without this, someone who opens the app once in the
// morning and leaves it running wouldn't see today's update prompt at all.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export function ServiceWorkerRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // A controller already present at this point means an earlier version
    // of the SW was already active before this page load — i.e. this is a
    // returning visit, not someone's very first time opening the app.
    // Distinguishes "an update just landed" from "the app just installed
    // for the first time", which would otherwise show the same events.
    const hadControllerAtMount = Boolean(navigator.serviceWorker.controller);

    let cleanupUpdateWatch: (() => void) | undefined;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // A new version may already be sitting installed from a moment ago.
        if (hadControllerAtMount && registration.waiting) {
          setUpdateAvailable(true);
        }

        function watchInstallingWorker() {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && hadControllerAtMount) {
              setUpdateAvailable(true);
            }
          });
        }
        registration.addEventListener("updatefound", watchInstallingWorker);

        function checkForUpdate() {
          if (document.visibilityState === "visible") registration.update();
        }
        const interval = setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
        document.addEventListener("visibilitychange", checkForUpdate);

        cleanupUpdateWatch = () => {
          registration.removeEventListener("updatefound", watchInstallingWorker);
          clearInterval(interval);
          document.removeEventListener("visibilitychange", checkForUpdate);
        };
      })
      .catch(() => {
        // Non-fatal — the app works fine without it, this is purely a
        // reopen-speed optimization (plus this update-prompt feature).
      });

    // The new SW takes over automatically (sw.js already calls
    // skipWaiting + clients.claim unconditionally), so this event is a
    // reliable "an update just landed" signal. Deliberately NOT reloading
    // automatically here — a silent reload could interrupt something the
    // person is in the middle of (filling a form, an active exam-prep
    // timer). Only a manual tap on the banner below reloads the page.
    function handleControllerChange() {
      if (hadControllerAtMount) setUpdateAvailable(true);
    }
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      cleanupUpdateWatch?.();
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 md:bottom-4">
      <div className="flex w-full max-w-sm items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 pl-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
        <p className="flex-1 text-sm font-medium">A new version is ready — new features and fixes are in.</p>
        <Button size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="h-3.5 w-3.5" />
          Update
        </Button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="shrink-0 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
