"use client";
import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MaterialFileRow } from "@/components/material-file-row";
import { sortByCategoryOrder, type MaterialEntry } from "@/lib/materials-types";

interface MaterialsBrowserProps {
  entries: MaterialEntry[];
}

export function MaterialsBrowser({ entries }: MaterialsBrowserProps) {
  const subjects = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) map.set(e.subject, (map.get(e.subject) ?? 0) + 1);
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [entries]);

  const [activeSubject, setActiveSubject] = useState(subjects[0]?.name ?? "");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [filter, setFilter] = useState("");

  const subjectEntries = useMemo(
    () => entries.filter((e) => e.subject === activeSubject),
    [entries, activeSubject]
  );

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of subjectEntries) map.set(e.category, (map.get(e.category) ?? 0) + 1);
    return sortByCategoryOrder([...map.entries()].map(([name, count]) => ({ name, count })));
  }, [subjectEntries]);

  const visibleEntries = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return subjectEntries
      .filter((e) => activeCategory === "All" || e.category === activeCategory)
      .filter((e) => !q || e.filename.toLowerCase().includes(q))
      .sort((a, b) => a.filename.localeCompare(b.filename));
  }, [subjectEntries, activeCategory, filter]);

  function selectSubject(name: string) {
    setActiveSubject(name);
    setActiveCategory("All");
    setFilter("");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Subject picker */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {subjects.map((s) => (
          <button
            key={s.name}
            type="button"
            onClick={() => selectSubject(s.name)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              s.name === activeSubject
                ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                : "border-neutral-200 text-neutral-600 hover:border-neutral-400 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600"
            }`}
          >
            {s.name} <span className="opacity-60">({s.count})</span>
          </button>
        ))}
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setActiveCategory("All")}>
          <Badge variant={activeCategory === "All" ? "default" : "outline"} className="cursor-pointer">
            All ({subjectEntries.length})
          </Badge>
        </button>
        {categories.map((c) => (
          <button key={c.name} type="button" onClick={() => setActiveCategory(c.name)}>
            <Badge variant={activeCategory === c.name ? "default" : "outline"} className="cursor-pointer">
              {c.name} ({c.count})
            </Badge>
          </button>
        ))}
      </div>

      {/* In-subject filename filter */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          className="pl-9"
          placeholder={`Filter files in ${activeSubject}…`}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* File list */}
      <div className="flex flex-col gap-2">
        {visibleEntries.length === 0 && (
          <p className="py-6 text-center text-sm text-neutral-400">No files match this filter.</p>
        )}
        {visibleEntries.map((entry) => (
          <MaterialFileRow key={entry.rawUrl} entry={entry} showCategoryBadge={activeCategory === "All"} />
        ))}
      </div>
    </div>
  );
}
