"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeedbackItem } from "@/lib/types";

export function FeedbackForm({ initialItems }: { initialItems: FeedbackItem[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState(initialItems);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(initialItems);
  }, [initialItems]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    setSent(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in.");
      setSending(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("feedback")
      .insert({ user_id: user.id, message: message.trim() });

    if (insertError) {
      setError(insertError.message);
      setSending(false);
      return;
    }

    setMessage("");
    setSent(true);
    setSending(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Send feedback</CardTitle>
          <CardDescription>Bugs, missing features, confusing screens — all welcome.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <textarea
              required
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What should be improved or fixed?"
              rows={4}
              className="w-full rounded-xl border border-neutral-200 bg-transparent px-3 py-2 text-sm placeholder:text-neutral-400 dark:border-neutral-800"
            />
            <p className="text-right text-xs text-neutral-400">{message.length}/2000</p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {sent && <p className="text-sm text-neutral-500">Thanks — your feedback was sent.</p>}
            <Button type="submit" disabled={sending} className="w-fit">
              <Send className="h-4 w-4" />
              {sending ? "Sending…" : "Send feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your past feedback</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-neutral-200 p-3 text-sm dark:border-neutral-800"
              >
                <p>{item.message}</p>
                <p className="mt-1 text-xs text-neutral-400">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
