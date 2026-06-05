"use client";

import { KeyboardProvider } from "@/components/command/keyboard-provider";
import { SkipLink } from "@/components/shared/skip-link";

export function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <KeyboardProvider>
      <SkipLink />
      {children}
    </KeyboardProvider>
  );
}
