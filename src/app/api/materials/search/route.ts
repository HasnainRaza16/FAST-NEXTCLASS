import { NextRequest, NextResponse } from "next/server";
import { searchAllMaterials } from "@/lib/materials";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }
  const results = await searchAllMaterials(q);
  return NextResponse.json({ results });
}
