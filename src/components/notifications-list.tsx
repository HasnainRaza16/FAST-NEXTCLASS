"use client";
import { useState } from "react";
import { Bell, BookOpen, TrendingUp, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS = {
  reminder: Bell,
  assignment: BookOpen,
  attendance: TrendingUp,
  general: Info,
};

export function NotificationsList({ initial }: { initial: Notification[] }) {
  const supabase = createClient();
  const [items, setItems] = useState(initial);

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    const unreadIds = items.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length > 0) {
      await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    }
  }

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Notifications {unreadCount > 0 && <Badge className="ml-2">{unreadCount} new</Badge>}
        </h1>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">No notifications yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((n) => {
            const Icon = ICONS[n.kind];
            return (
              <Card key={n.id} className={cn(!n.is_read && "border-neutral-900 dark:border-white")}>
                <CardContent className="flex items-start gap-3 p-4">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-sm text-neutral-500">{n.message}</p>
                    <p className="mt-1 text-xs text-neutral-400">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="shrink-0 rounded-lg border border-neutral-200 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
                    >
                      Mark read
                    </button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
