import type { TenantClient } from "@/lib/db/tenant-extension";
import type {
  CreateIssueInput,
  UpdateIssueInput,
  IssueDTO,
  IssueFilters,
  PaginatedResult,
} from "@/types";

const ISSUE_SELECT = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  organizationId: true,
  assignedToId: true,
  assignedTo: {
    select: { id: true, name: true, email: true },
  },
  createdById: true,
  createdBy: {
    select: { id: true, name: true, email: true },
  },
  createdAt: true,
  updatedAt: true,
} as const;

export async function getIssues(
  db: TenantClient,
  filters: IssueFilters = {},
  page = 1,
  pageSize = 20
): Promise<PaginatedResult<IssueDTO>> {
  const { search, status, priority, assignedToId } = filters;

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assignedToId) where.assignedToId = assignedToId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    db.issue.findMany({
      where,
      select: ISSUE_SELECT,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.issue.count({ where }),
  ]);

  return {
    data: data as unknown as IssueDTO[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getIssueById(
  db: TenantClient,
  id: string
): Promise<IssueDTO | null> {
  const issue = await db.issue.findFirst({
    where: { id },
    select: ISSUE_SELECT,
  });

  return issue as unknown as IssueDTO | null;
}

export async function createIssue(
  db: TenantClient,
  orgId: string,
  userId: string,
  input: CreateIssueInput
): Promise<IssueDTO> {
  const issue = await db.issue.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "OPEN",
      priority: input.priority ?? "MEDIUM",
      organizationId: orgId,
      createdById: userId,
      assignedToId: input.assignedToId ?? null,
    },
    select: ISSUE_SELECT,
  });

  return issue as unknown as IssueDTO;
}

export async function updateIssue(
  db: TenantClient,
  id: string,
  input: UpdateIssueInput
): Promise<IssueDTO | null> {
  try {
    const issue = await db.issue.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.assignedToId !== undefined && {
          assignedToId: input.assignedToId,
        }),
      },
      select: ISSUE_SELECT,
    });

    return issue as unknown as IssueDTO;
  } catch {
    return null;
  }
}

export async function deleteIssue(
  db: TenantClient,
  id: string
): Promise<boolean> {
  try {
    await db.issue.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
