"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AppUpdate = { id: string; title: string; message: string };

export default function UpdateBanner() {
  const [update, setUpdate] = useState<AppUpdate | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: latest } = await supabase
        .from("app_updates")
        .select("id,title,message")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latest) {
        const { data: read } = await supabase
          .from("update_reads")
          .select("update_id")
          .eq("update_id", latest.id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!read) setUpdate(latest);
      }

      channel = supabase
        .channel("app_updates")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "app_updates" },
          (payload) => setUpdate(payload.new as AppUpdate)
        )
        .subscribe();
    }

    load();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function dismiss() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && update) {
      await supabase
        .from("update_reads")
        .insert({ user_id: user.id, update_id: update.id });
    }
    setUpdate(null);
  }

  if (!update) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-blue-600 text-white p-3 flex items-center justify-between gap-3">
      <div>
        <strong>{update.title}</strong>
        <span className="ml-2">{update.message}</span>
      </div>
      <button onClick={dismiss} className="underline shrink-0">
        Got it
      </button>
    </div>
  );
}