"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SuperAdminTopbarActions() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={signOut}>
      <LogOut className="h-4 w-4" strokeWidth={1.75} />
      <span className="hidden sm:inline">Sign out</span>
    </Button>
  );
}

/** @deprecated Use SuperAdminTopbarActions inside AppTopbar */
export function SuperAdminTopbar({
  userName,
  onMenuClick,
}: {
  userName?: string;
  onMenuClick?: () => void;
}) {
  return null;
}
