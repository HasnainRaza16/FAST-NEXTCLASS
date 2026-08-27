"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>Choose a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Password updated. Redirecting you to your dashboard…
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={loading} className="mt-2">
                {loading ? "Updating…" : "Update password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
