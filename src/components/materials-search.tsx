"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { MaterialEntry } from "@/lib/materials-types";
import { MaterialFileRow } from "@/components/material-file-row";

export function MaterialsSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MaterialEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale results when the query is cleared/too short, not a derived-state loop
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/materials/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          className="pl-9 pr-9"
          placeholder="Search all semesters — subject, file name, or type…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {query.trim().length >= 2 && (
        <div className="flex flex-col gap-2">
          {loading && <p className="text-sm text-neutral-400">Searching…</p>}
          {!loading && results.length === 0 && (
            <p className="text-sm text-neutral-400">No files matched &quot;{query.trim()}&quot;.</p>
          )}
          {!loading &&
            results.map((r) => <MaterialFileRow key={r.rawUrl} entry={r} showContext showCategoryBadge />)}
          {!loading && results.length > 0 && (
            <p className="text-center text-xs text-neutral-400">
              Showing top {results.length} match{results.length !== 1 ? "es" : ""}.{" "}
              <Link href="/dashboard/materials" className="underline">
                Browse by semester
              </Link>{" "}
              for the full list.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
