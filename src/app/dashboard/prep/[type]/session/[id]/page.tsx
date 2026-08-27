import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSemesterMaterials } from "@/lib/materials";
import { filterMaterialsForPrep, isPrepType } from "@/lib/prep";
import { PrepSessionRunner } from "@/components/prep-session-runner";
import type { PrepSession } from "@/lib/types";

export default async function PrepSessionPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  if (!isPrepType(type)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  const { data: session } = await supabase
    .from("prep_sessions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single<PrepSession>();

  if (!session || session.prep_type !== type) {
    notFound();
  }

  const allMaterials = await getSemesterMaterials(session.semester);
  const { primary, supporting } = filterMaterialsForPrep(allMaterials, type, session.subject);

  return <PrepSessionRunner session={session} primary={primary} supporting={supporting} />;
}
