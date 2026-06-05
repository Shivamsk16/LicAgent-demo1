"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "loading" | "password" | "activating" | "success" | "error";

function parseHashParams() {
  if (typeof window === "undefined") return {};
  const hash = window.location.hash.replace(/^#/, "");
  return Object.fromEntries(new URLSearchParams(hash));
}

export default function InviteCompletePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("loading");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuthCallback() {
      const supabase = createClient();
      const params = parseHashParams();
      const accessToken = params.access_token;
      const refreshToken = params.refresh_token;
      const type = params.type;

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) {
          setError(sessionError.message);
          setStep("error");
          return;
        }
        window.history.replaceState(null, "", window.location.pathname);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(
          "Could not establish a session. The link may have expired — ask your manager to resend the invitation."
        );
        setStep("error");
        return;
      }

      setEmail(user.email ?? null);

      if (type === "invite" || type === "recovery") {
        setStep("password");
        return;
      }

      await finishActivation();
    }

    handleAuthCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function finishActivation() {
    setStep("activating");
    try {
      const res = await fetch("/api/auth/activate-membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message ?? "Failed to activate membership");
      }

      setStep("success");
      router.push(json.data?.redirectTo ?? "/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Activation failed");
      setStep("error");
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setStep("activating");

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setStep("password");
      return;
    }

    await finishActivation();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-lic-neutral-50 p-4">
      <Card className="w-full max-w-md">
        {step === "loading" && (
          <>
            <h1 className="text-lg font-semibold">Completing invitation…</h1>
            <p className="mt-2 text-sm text-lic-neutral-500">
              Setting up your account. Please wait.
            </p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-lic-neutral-200">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-lic-yellow-400" />
            </div>
          </>
        )}

        {step === "password" && (
          <>
            <h1 className="text-lg font-semibold">Set your password</h1>
            <p className="mt-1 text-sm text-lic-neutral-500">
              {email ? `Account: ${email}` : "Create a password to finish joining your branch."}
            </p>
            <form onSubmit={handleSetPassword} className="mt-6 space-y-4">
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
              <Button type="submit" className="w-full">
                Continue to dashboard
              </Button>
            </form>
          </>
        )}

        {step === "activating" && (
          <>
            <h1 className="text-lg font-semibold">Activating your access…</h1>
            <p className="mt-2 text-sm text-lic-neutral-500">
              Linking you to your branch workspace.
            </p>
          </>
        )}

        {step === "success" && (
          <>
            <h1 className="text-lg font-semibold text-lic-green-600">Welcome!</h1>
            <p className="mt-2 text-sm text-lic-neutral-500">Redirecting to your dashboard…</p>
          </>
        )}

        {step === "error" && (
          <>
            <h1 className="text-lg font-semibold text-lic-red-600">Invitation error</h1>
            <p className="mt-2 text-sm text-lic-neutral-500">{error}</p>
            <div className="mt-6 flex gap-2">
              <Button variant="secondary" onClick={() => router.push("/login")}>
                Go to login
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
