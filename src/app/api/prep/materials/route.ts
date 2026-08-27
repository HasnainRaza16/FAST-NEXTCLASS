import { NextRequest, NextResponse } from "next/server";
import { getSemesterMaterials } from "@/lib/materials";
import { filterMaterialsForPrep, isPrepType } from "@/lib/prep";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "";
  const semesterParam = request.nextUrl.searchParams.get("semester") ?? "";
  const subject = request.nextUrl.searchParams.get("subject") ?? "";
  const semester = Number(semesterParam);

  if (!isPrepType(type) || !Number.isInteger(semester) || semester < 1 || semester > 5 || !subject) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const all = await getSemesterMaterials(semester);
  const { primary, supporting } = filterMaterialsForPrep(all, type, subject);

  return NextResponse.json({ primary, supporting });
}
