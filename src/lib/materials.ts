import { readFile } from "node:fs/promises";
import path from "node:path";
import type { MaterialEntry, MaterialsSummary } from "@/lib/materials-types";

export type {
  MaterialCategory,
  MaterialFileType,
  MaterialEntry,
  SubjectSummary,
  SemesterSummary,
  MaterialsSummary,
} from "@/lib/materials-types";
export { CATEGORY_ORDER, sortByCategoryOrder } from "@/lib/materials-types";

const DATA_DIR = path.join(process.cwd(), "data", "materials");

export async function getMaterialsSummary(): Promise<MaterialsSummary> {
  const raw = await readFile(path.join(DATA_DIR, "summary.json"), "utf-8");
  return JSON.parse(raw);
}

export async function getSemesterMaterials(semester: number): Promise<MaterialEntry[]> {
  try {
    const raw = await readFile(path.join(DATA_DIR, `semester-${semester}.json`), "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** Cross-semester filename/subject search, used by the materials search bar. */
export async function searchAllMaterials(query: string, limit = 80): Promise<MaterialEntry[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: MaterialEntry[] = [];
  for (let sem = 1; sem <= 5; sem++) {
    const entries = await getSemesterMaterials(sem);
    for (const e of entries) {
      if (
        e.filename.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      ) {
        results.push(e);
        if (results.length >= limit) return results;
      }
    }
  }
  return results;
}
