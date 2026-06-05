"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField } from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const queryError = searchParams.get("error");
  const resetSuccess = searchParams.get("reset") === "success";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    queryError === "no_tenant"
      ? "Your account is not assigned to a branch. Contact your administrator."
      : ""
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-lic-neutral-50 p-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-lic-neutral-900 text-xs font-bold text-white">
            LIC
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-lic-neutral-900">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-lic-neutral-500">
            Agent management workspace
          </p>
        </div>
        <Card padding="lg">
            <Form as="form" onSubmit={handleSubmit}>
              <FormField label="Email" htmlFor="email" required>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@branch.com"
                  required
                  autoComplete="email"
                />
              </FormField>
              <FormField label="Password" htmlFor="password" required>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </FormField>
              <p className="text-right text-xs">
                <Link href="/forgot-password" className="text-lic-neutral-500 hover:text-lic-neutral-800 hover:underline">
                  Forgot password?
                </Link>
              </p>
              {resetSuccess && (
                <Alert variant="success" title="Password updated">
                  Sign in with your new password.
                </Alert>
              )}
              {error && <Alert variant="error">{error}</Alert>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </Form>
        </Card>
      </div>
    </div>
  );
}
