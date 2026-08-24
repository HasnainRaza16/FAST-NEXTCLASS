"use client";
import { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export type InstallPlatform = "ios" | "android" | "desktop";

// Not a password/token — just a client-side UI preference (when the user
// last brushed off the install card), so plain localStorage is fine here.
const DISMISS_KEY = "nextclass-install-dismissed-at";
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function detectPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  // iPadOS 13+ reports as "MacIntel" with touch support — treat as iOS too.
  if (/macintosh/i.test(ua) && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1) {
    return "ios";
  }
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

/**
 * Wraps the browser's native PWA install flow:
 * - Captures `beforeinstallprompt` (Chrome/Edge/Android) so we can trigger
 *   it from our own "Install App" button instead of waiting on the browser.
 * - Detects standalone/installed mode so the UI can hide itself once the
 *   app is already installed.
 * - Tracks a 14-day cooldown after a dismissal so the install card doesn't
 *   nag — callers decide what "dismissed" means for their UI (we don't
 *   force-hide anything here, since this card already only lives in one
 *   deliberate, non-popup location: Profile).
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>("desktop");
  const [recentlyDismissed, setRecentlyDismissed] = useState(false);

  useEffect(() => {
    // These reads (matchMedia, navigator.standalone, UA, localStorage) only
    // resolve correctly in the browser. Deferring them to this mount effect
    // — rather than a useState lazy initializer — is deliberate: it keeps
    // the first client render matching the server-rendered HTML (both
    // "unknown yet") and avoids a hydration mismatch, at the cost of one
    // extra render right after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsStandalone(isStandaloneMode());
    setPlatform(detectPlatform());

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    setRecentlyDismissed(Boolean(dismissedAt) && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS);

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    function handleAppInstalled() {
      setDeferredPrompt(null);
      setIsStandalone(true);
      localStorage.removeItem(DISMISS_KEY);
    }
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    function handleDisplayModeChange(e: MediaQueryListEvent) {
      setIsStandalone(e.matches);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    standaloneQuery.addEventListener("change", handleDisplayModeChange);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      standaloneQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return "unavailable" as const;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    // Chrome only allows a captured prompt to be used once.
    setDeferredPrompt(null);
    if (choice.outcome === "dismissed") {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      setRecentlyDismissed(true);
    }
    return choice.outcome;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setRecentlyDismissed(true);
  }, []);

  return {
    canPromptInstall: Boolean(deferredPrompt),
    promptInstall,
    isStandalone,
    platform,
    recentlyDismissed,
    dismiss,
  };
}
