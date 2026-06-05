"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCommandPaletteStore } from "@/store/command-palette";
import { CommandPalette } from "./command-palette";
import { KeyboardShortcutsDialog } from "./keyboard-shortcuts-dialog";

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const setOpen = useCommandPaletteStore((s) => s.setOpen);
  const setShortcutsOpen = useCommandPaletteStore((s) => s.setShortcutsOpen);
  const paletteOpen = useCommandPaletteStore((s) => s.open);
  const chordRef = useRef<string | null>(null);
  const chordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function isTypingTarget(el: EventTarget | null) {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable
      );
    }

    function onKeyDown(e: KeyboardEvent) {
      if (paletteOpen) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        return;
      }

      if (isTypingTarget(e.target)) return;

      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        if (!pathname.includes("/customers/new")) {
          e.preventDefault();
          router.push("/dashboard/customers/new");
        }
        return;
      }

      if (e.key === "r" && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        router.push("/dashboard/payments/record");
        return;
      }

      if (e.key === "P" && e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        router.push("/dashboard/policies/new");
        return;
      }

      if (e.key.toLowerCase() === "g") {
        chordRef.current = "g";
        if (chordTimer.current) clearTimeout(chordTimer.current);
        chordTimer.current = setTimeout(() => {
          chordRef.current = null;
        }, 1000);
        return;
      }

      if (chordRef.current === "g") {
        chordRef.current = null;
        if (chordTimer.current) clearTimeout(chordTimer.current);
        const routes: Record<string, string> = {
          d: "/dashboard",
          c: "/dashboard/customers",
          p: "/dashboard/policies",
          y: "/dashboard/payments",
          r: "/dashboard/reports",
        };
        const href = routes[e.key.toLowerCase()];
        if (href) {
          e.preventDefault();
          router.push(href);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pathname, paletteOpen, router, setOpen, setShortcutsOpen]);

  return (
    <>
      {children}
      <CommandPalette />
      <KeyboardShortcutsDialog />
    </>
  );
}
