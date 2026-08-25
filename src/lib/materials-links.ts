import type { MaterialEntry } from "@/lib/materials-types";

/** Opens the file on GitHub (works for every file type, including ones browsers can't preview inline). */
export function viewHref(entry: Pick<MaterialEntry, "githubUrl">): string {
  return entry.githubUrl;
}

/** Routes through our own API so the browser treats it as a real download instead of a navigation. */
export function downloadHref(entry: Pick<MaterialEntry, "rawUrl" | "filename">): string {
  const params = new URLSearchParams({ url: entry.rawUrl, filename: entry.filename });
  return `/api/materials/download?${params.toString()}`;
}

/**
 * Shares the file's GitHub link via the native share sheet where available
 * (Android/iOS/most modern browsers). Falls back to copying the link to the
 * clipboard — mainly older desktop browsers — and returns which path was
 * used so the caller can show the right feedback.
 */
export async function shareMaterial(
  entry: Pick<MaterialEntry, "githubUrl" | "filename" | "subject">
): Promise<"shared" | "copied" | "cancelled" | "failed"> {
  const shareData = {
    title: entry.filename,
    text: `${entry.filename} — ${entry.subject}`,
    url: entry.githubUrl,
  };

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(shareData);
      return "shared";
    } catch (err) {
      // User dismissed the native share sheet — not an error worth surfacing.
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
      // Fall through to clipboard fallback for any other failure.
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(entry.githubUrl);
      return "copied";
    } catch {
      return "failed";
    }
  }

  return "failed";
}
