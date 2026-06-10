"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField } from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? "Failed to send reset link");
        return;
      }
      setSent(true);
    } catch {
      setError("Failed to send reset link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-lic-neutral-50 p-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-lic-yellow-400 text-xs font-bold text-lic-neutral-900">
            LIC
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-lic-neutral-900">
            Forgot password
          </h1>
          <p className="mt-2 text-sm text-lic-neutral-500">
            Enter your email and we will send a reset link.
          </p>
        </div>
        <Card padding="lg">
          {sent ? (
            <Alert variant="success" title="Check your email">
              If an account exists for {email}, you will receive a password reset link shortly.
              <Link href="/login" className="mt-3 block text-xs font-medium underline">
                Back to sign in
              </Link>
            </Alert>
          ) : (
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
              {error && <Alert variant="error">{error}</Alert>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
              <p className="mt-4 text-center text-sm text-lic-neutral-500">
                <Link href="/login" className="text-lic-blue-400 hover:underline">
                  Back to sign in
                </Link>
              </p>
            </Form>
          )}
        </Card>
      </div>
    </div>
  );
}
