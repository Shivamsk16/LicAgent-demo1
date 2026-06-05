"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Bell } from "lucide-react";
import { relativeTime } from "@/lib/utils/dates";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { cn } from "@/lib/utils/cn";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const qcRef = useRef(qc);
  qcRef.current = qc;
  const trapRef = useFocusTrap(open);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      return json.data as {
        notifications: Array<{
          id: string;
          title: string;
          body: string | null;
          link: string | null;
          read: boolean;
          created_at: string;
        }>;
        unreadCount: number;
      };
    },
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function subscribe() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      const channelName = `notifications-${user.id}`;
      const topic = `realtime:${channelName}`;

      // React Strict Mode can remount before cleanup; drop any stale channel first.
      const existing = supabase.getChannels().find((ch) => ch.topic === topic);
      if (existing) {
        await supabase.removeChannel(existing);
      }
      if (cancelled) return;

      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            qcRef.current.invalidateQueries({ queryKey: ["notifications"] });
          }
        )
        .subscribe();

      if (cancelled && channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    }

    subscribe();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, []);

  const unread = data?.unreadCount ?? 0;
  const items = data?.notifications ?? [];

  async function markAllRead() {
    await fetch("/api/notifications/read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function markRead(id: string) {
    await fetch("/api/notifications/read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-lic-neutral-600 transition-colors duration-fast ease-out hover:bg-black/[0.04] active:scale-[0.97]"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-lic-red-600 px-1 text-[10px] font-semibold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-dropdown"
            onClick={() => setOpen(false)}
            aria-label="Close notifications"
          />
          <div
            ref={trapRef}
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 top-full z-dropdown mt-2 w-[min(380px,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-xl bg-lic-neutral-0 shadow-lg ring-1 ring-black/[0.08]"
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3">
              <span className="text-sm font-semibold text-lic-neutral-900">
                Notifications
                {unread > 0 && (
                  <span className="ml-2 text-[13px] font-normal text-lic-neutral-500">
                    {unread} unread
                  </span>
                )}
              </span>
              {unread > 0 && (
                <Button variant="link" size="sm" className="text-xs" onClick={markAllRead}>
                  Mark all read
                </Button>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto scrollbar-thin" role="list">
              {items.length === 0 && (
                <li className="px-4 py-10 text-center text-[13px] text-lic-neutral-500">
                  You&apos;re all caught up
                </li>
              )}
              {items.map((n) => (
                <li key={n.id} className="border-b border-black/[0.04] last:border-0">
                  <Link
                    href={n.link ?? "#"}
                    className={cn(
                      "block px-4 py-3 transition-colors duration-fast ease-out hover:bg-black/[0.02]",
                      !n.read && "bg-lic-blue-50/40"
                    )}
                    onClick={() => {
                      if (!n.read) markRead(n.id);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lic-blue-500" aria-hidden />
                      )}
                      <div className={cn("min-w-0 flex-1", n.read && "pl-3.5")}>
                        <p className="text-[13px] font-medium text-lic-neutral-900">{n.title}</p>
                        {n.body && (
                          <p className="mt-0.5 text-xs leading-relaxed text-lic-neutral-500">{n.body}</p>
                        )}
                        <p className="mt-1 text-2xs text-lic-neutral-400">
                          {relativeTime(n.created_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
