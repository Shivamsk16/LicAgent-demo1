import "server-only";

import { cache } from "react";
import { getActiveMemberships as getActiveMembershipsBase } from "@/lib/auth/memberships";
import { getSessionUser as getSessionUserBase, isSuperAdmin as isSuperAdminBase } from "@/lib/auth/super-admin";

/** Request-scoped deduplication for server components and API routes. */
export const getActiveMemberships = cache(getActiveMembershipsBase);

export const getCurrentUser = cache(getSessionUserBase);

export const getSessionUser = getCurrentUser;

export const isSuperAdmin = cache(isSuperAdminBase);
