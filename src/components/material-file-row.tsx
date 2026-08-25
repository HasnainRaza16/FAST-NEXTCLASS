"use client";
import { useState } from "react";
import { ExternalLink, Download, Share2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MaterialEntry } from "@/lib/materials-types";
import { FILE_TYPE_ICON } from "@/lib/material-icons";
import { viewHref, downloadHref, shareMaterial } from "@/lib/materials-links";

interface MaterialFileRowProps {
  entry: MaterialEntry;
  /** Show "Sem N · Subject" under the filename — used in cross-semester search results. */
  showContext?: boolean;
  /** Show the category badge — hidden when the parent list is already filtered to one category. */
  showCategoryBadge?: boolean;
}

export function MaterialFileRow({ entry, showContext, showCategoryBadge }: MaterialFileRowProps) {
  const Icon = FILE_TYPE_ICON[entry.type];
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  async function handleShare() {
    const result = await shareMaterial(entry);
    if (result === "copied") {
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 1800);
    }
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3">
        <Icon className="h-4 w-4 shrink-0 text-neutral-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{entry.filename}</p>
          {showContext && (
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
              Sem {entry.semester} · {entry.subject}
            </p>
          )}
        </div>
        {showCategoryBadge && (
          <Badge variant="outline" className="hidden shrink-0 sm:inline-flex">
            {entry.category}
          </Badge>
        )}
        <a
          href={viewHref(entry)}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
          title="View"
          aria-label={`View ${entry.filename}`}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        <a
          href={downloadHref(entry)}
          className="shrink-0 rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
          title="Download"
          aria-label={`Download ${entry.filename}`}
        >
          <Download className="h-4 w-4" />
        </a>
        <button
          type="button"
          onClick={handleShare}
          className="shrink-0 rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
          title="Share"
          aria-label={`Share ${entry.filename}`}
        >
          {shareState === "copied" ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
        </button>
      </CardContent>
    </Card>
  );
}
