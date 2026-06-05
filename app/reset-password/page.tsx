"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField } from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.push("/login?reset=success");
    router.refresh();
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-lic-neutral-50 p-4">
        <Card padding="lg" className="w-full max-w-[400px]">
          <Alert variant="error" title="Reset link invalid or expired">
            Request a new password reset link to continue.
            <Link href="/forgot-password" className="mt-3 block text-xs font-medium underline">
              Request new link
            </Link>
          </Alert>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-lic-neutral-50 p-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-lic-yellow-400 text-xs font-bold text-lic-neutral-900">
            LIC
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-lic-neutral-900">
            Set new password
          </h1>
          <p className="mt-2 text-sm text-lic-neutral-500">
            Choose a strong password for your account.
          </p>
        </div>
        <Card padding="lg">
          <Form as="form" onSubmit={handleSubmit}>
            <FormField label="New password" htmlFor="password" required>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </FormField>
            <FormField label="Confirm password" htmlFor="confirm" required>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </FormField>
            {error && <Alert variant="error">{error}</Alert>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating…" : "Update password"}
            </Button>
          </Form>
        </Card>
      </div>
    </div>
  );
}
