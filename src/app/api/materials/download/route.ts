import { NextRequest, NextResponse } from "next/server";

// Only ever proxy files we ourselves generated links for — raw GitHub
// content from the known course-material repos. Prevents this route being
// used as an open proxy for arbitrary URLs.
const ALLOWED_HOST = "raw.githubusercontent.com";
const ALLOWED_REPO_PREFIXES = [
  "/FAST-NUCES-Hub/FAST-KHI-Semester-1/",
  "/MuxammilSidd/FAST-KHI-Semester-2/",
  "/MuxammilSidd/FAST-KHI-Semester-3/",
  "/MuxammilSidd/FAST-KHI-Semester-4/",
  "/MuxammilSidd/FAST-KHI-Semester-5/",
];

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url");
  const filename = request.nextUrl.searchParams.get("filename") ?? "download";

  if (!target) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const allowed =
    parsed.protocol === "https:" &&
    parsed.hostname === ALLOWED_HOST &&
    ALLOWED_REPO_PREFIXES.some((prefix) => parsed.pathname.startsWith(prefix));

  if (!allowed) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  const upstream = await fetch(parsed.toString());
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const safeFilename = filename.replace(/["\r\n]/g, "");

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
