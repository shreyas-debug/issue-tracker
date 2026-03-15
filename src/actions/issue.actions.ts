"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/lib/middleware/withTenant";
import {
  createIssue,
  updateIssue,
  deleteIssue,
} from "@/services/issue.service";
import {
  createIssueSchema,
  updateIssueSchema,
} from "@/lib/validation/schemas";
import { prisma } from "@/lib/db/prisma";
import type { ActionResult, IssueDTO } from "@/types";

/**
 * Validates that a user ID belongs to the given organization.
 * Prevents cross-tenant user references where an issue in org A could be
 * assigned to a user from org B, leaking that user's identity.
 */
async function validateAssignee(
  assignedToId: string,
  orgId: string
): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { id: assignedToId, organizationId: orgId },
    select: { id: true },
  });
  return user !== null;
}

export async function createIssueAction(
  formData: FormData
): Promise<ActionResult<IssueDTO>> {
  try {
    const { db, session, orgId } = await withTenant();

    const raw = {
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      priority: formData.get("priority") || undefined,
      status: formData.get("status") || undefined,
      assignedToId: formData.get("assignedToId") || undefined,
    };

    const parsed = createIssueSchema.safeParse(raw);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    if (parsed.data.assignedToId) {
      const valid = await validateAssignee(parsed.data.assignedToId, orgId);
      if (!valid) {
        return {
          success: false,
          error: "Assigned user does not belong to your organization",
        };
      }
    }

    const issue = await createIssue(db, orgId, session.sub, parsed.data);

    revalidatePath("/issues");
    return { success: true, data: issue };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { success: false, error: "Unauthorized" };
    }
    console.error("[createIssueAction]", error);
    return { success: false, error: "Failed to create issue" };
  }
}

export async function updateIssueAction(
  formData: FormData
): Promise<ActionResult<IssueDTO>> {
  try {
    const { db, orgId } = await withTenant();

    // Normalize assignedToId: field absent → undefined (no change),
    // empty string → null (unassign), non-empty string → keep as-is.
    const rawAssignee = formData.get("assignedToId");
    const assignedToId =
      rawAssignee === null ? undefined : rawAssignee || null;

    const raw = {
      id: formData.get("id"),
      title: formData.get("title") || undefined,
      description: formData.get("description") || undefined,
      priority: formData.get("priority") || undefined,
      status: formData.get("status") || undefined,
      assignedToId,
    };

    const parsed = updateIssueSchema.safeParse(raw);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    if (parsed.data.assignedToId) {
      const valid = await validateAssignee(parsed.data.assignedToId, orgId);
      if (!valid) {
        return {
          success: false,
          error: "Assigned user does not belong to your organization",
        };
      }
    }

    const { id, ...updates } = parsed.data;
    const issue = await updateIssue(db, id, updates);

    if (!issue) {
      return { success: false, error: "Issue not found" };
    }

    revalidatePath("/issues");
    revalidatePath(`/issues/${id}`);
    return { success: true, data: issue };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { success: false, error: "Unauthorized" };
    }
    console.error("[updateIssueAction]", error);
    return { success: false, error: "Failed to update issue" };
  }
}

export async function deleteIssueAction(
  id: string
): Promise<ActionResult<void>> {
  try {
    const { db } = await withTenant();

    const deleted = await deleteIssue(db, id);

    if (!deleted) {
      return { success: false, error: "Issue not found or already deleted" };
    }

    revalidatePath("/issues");
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { success: false, error: "Unauthorized" };
    }
    console.error("[deleteIssueAction]", error);
    return { success: false, error: "Failed to delete issue" };
  }
}
