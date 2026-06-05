"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SuperAdminTopbar({
  userName,
  onMenuClick,
}: {
  userName?: string;
  onMenuClick?: () => void;
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-lic-neutral-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            className="rounded-btn p-2 text-lic-neutral-500 hover:bg-lic-neutral-50 lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <span className="text-sm text-lic-neutral-500">
          SuperAdmin{userName ? ` · ${userName}` : ""}
        </span>
      </div>
      <Button variant="ghost" size="sm" onClick={signOut}>
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </header>
  );
}
