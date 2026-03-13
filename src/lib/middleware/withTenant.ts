import { requireSession } from "@/lib/auth/session";
import { createTenantClient, type TenantClient } from "@/lib/db/tenant-extension";
import type { SessionPayload } from "@/types";

export interface TenantContext {
  session: SessionPayload;
  db: TenantClient;
  orgId: string;
}

/**
 * The Shield: wraps any Server Action or server utility with tenant context.
 *
 * Extracts the session, validates the JWT, and returns a scoped Prisma client
 * bound to the authenticated organization. Throws UNAUTHORIZED if no valid
 * session exists, halting execution before any database interaction occurs.
 *
 * Usage:
 *   const { db, session, orgId } = await withTenant();
 *   const issues = await db.issue.findMany(); // auto-scoped to orgId
 */
export async function withTenant(): Promise<TenantContext> {
  const session = await requireSession();
  const db = createTenantClient(session.orgId);

  return {
    session,
    db,
    orgId: session.orgId,
  };
}
