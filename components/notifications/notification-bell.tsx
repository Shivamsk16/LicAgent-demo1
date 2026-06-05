"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Bell } from "lucide-react";
import { relativeTime } from "@/lib/utils/dates";
import { createClient } from "@/lib/supabase/client";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

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
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            qc.invalidateQueries({ queryKey: ["notifications"] });
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [qc]);

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

  return (
    <div className="relative">
      <button
        type="button"
        className="relative rounded-btn p-2 text-lic-neutral-500 hover:bg-lic-neutral-50"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-lic-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-[360px] rounded-card border border-lic-neutral-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="font-semibold text-sm">Notifications</span>
              {unread > 0 && (
                <button type="button" className="text-xs text-lic-blue-400" onClick={markAllRead}>
                  Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {items.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-lic-neutral-500">No notifications</li>
              )}
              {items.map((n) => (
                <li key={n.id} className="border-b last:border-0">
                  <Link
                    href={n.link ?? "#"}
                    className={`block px-4 py-3 hover:bg-lic-yellow-50 ${!n.read ? "bg-lic-yellow-50/50" : ""}`}
                    onClick={() => setOpen(false)}
                  >
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.body && <p className="text-xs text-lic-neutral-500">{n.body}</p>}
                    <p className="mt-1 text-xs text-lic-neutral-500">{relativeTime(n.created_at)}</p>
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
