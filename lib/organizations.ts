import { createClient } from "@/lib/supabase/server";

type CurrentOrganization = { id: string; role: "owner" | "admin" | "member" | "viewer" };

/** Returns a server-derived organization. Never accept this value from a browser request. */
export async function getCurrentOrganization(): Promise<CurrentOrganization | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membership) return { id: membership.organization_id, role: membership.role as CurrentOrganization["role"] };

  // Supports accounts created before the migration is applied. The slug is
  // deterministic, so concurrent first requests converge on one workspace.
  const slug = `personal-${user.id.replaceAll("-", "")}`;
  const { data: organization, error } = await supabase
    .from("organizations")
    .upsert({ name: `${user.email?.split("@")[0] || "Personal"}'s workspace`, slug }, { onConflict: "slug" })
    .select("id")
    .single();
  if (error || !organization) return null;

  const { error: memberError } = await supabase
    .from("organization_members")
    .upsert({ organization_id: organization.id, user_id: user.id, role: "owner" }, { onConflict: "organization_id,user_id" });
  if (memberError) return null;
  return { id: organization.id, role: "owner" };
}

export function canManageAgents(role: CurrentOrganization["role"]) {
  return role === "owner" || role === "admin";
}
