import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("super_admin")
    .eq("id", userId)
    .single();
  return data?.super_admin === true;
}

export async function requireSuperAdmin() {
  const user = await getSessionUser();
  if (!user) return { error: "UNAUTHORIZED" as const, user: null };
  const ok = await isSuperAdmin(user.id);
  if (!ok) return { error: "FORBIDDEN" as const, user: null };
  return { error: null, user };
}
