"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InviteInfo = {
  valid: boolean;
  email?: string;
  branchName?: string;
  branchLocation?: string;
  roleName?: string;
  error?: string;
};

export default function InviteTokenPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/auth/accept-invite?token=${encodeURIComponent(params.token)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setInfo(json.data);
        else setInfo({ valid: false, error: json.error?.message ?? "Invalid invitation" });
      })
      .catch(() => setInfo({ valid: false, error: "Failed to load invitation" }))
      .finally(() => setLoading(false));
  }, [params.token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    setError("");

    const res = await fetch("/api/auth/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: params.token,
        password,
        full_name: fullName || undefined,
        phone: phone || undefined,
      }),
    });
    const json = await res.json();

    if (!json.success) {
      setError(json.error?.message ?? "Failed to accept invitation");
      setSubmitting(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: json.data.email,
      password,
    });

    if (signInError) {
      setError(
        "Account created but sign-in failed. Try logging in with your new password."
      );
      setSubmitting(false);
      router.push("/login");
      return;
    }

    if (json.data.tenantId) {
      await fetch("/api/tenant/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: json.data.tenantId }),
      });
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-lic-neutral-50 p-4">
        <Card className="w-full max-w-md p-6">
          <h1 className="text-lg font-semibold">Loading invitation…</h1>
          <p className="mt-2 text-sm text-lic-neutral-500">Please wait.</p>
        </Card>
      </div>
    );
  }

  if (!info?.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-lic-neutral-50 p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <h1 className="text-lg font-semibold text-lic-red-600">Invitation unavailable</h1>
          <p className="mt-2 text-sm text-lic-neutral-500">
            {info?.error ?? "This link is invalid or has expired."}
          </p>
          <p className="mt-4 text-xs text-lic-neutral-500">
            Contact your branch manager to request a new invitation.
          </p>
          <Button className="mt-6" variant="secondary" onClick={() => router.push("/login")}>
            Go to login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-lic-neutral-50 p-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-xl font-semibold">Join {info.branchName}</h1>
        {info.branchLocation && (
          <p className="text-sm text-lic-neutral-500">{info.branchLocation}</p>
        )}
        {info.roleName && (
          <p className="mt-1 text-sm">
            Role: <span className="font-medium">{info.roleName}</span>
          </p>
        )}
        <p className="mt-4 text-sm text-lic-neutral-500">
          Create your password to activate <strong>{info.email}</strong>.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-lic-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating account…" : "Accept invitation"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
