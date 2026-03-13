export type Role = "ADMIN" | "MEMBER";
export type Status = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface SessionPayload {
  sub: string;
  orgId: string;
  role: Role;
  email: string;
  name: string;
  orgName: string;
  iat?: number;
  exp?: number;
}

export interface OrganizationDTO {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  createdAt: Date;
}

export interface IssueDTO {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  organizationId: string;
  assignedToId: string | null;
  assignedTo: Pick<UserDTO, "id" | "name" | "email"> | null;
  createdById: string;
  createdBy: Pick<UserDTO, "id" | "name" | "email">;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIssueInput {
  title: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  assignedToId?: string;
}

export interface UpdateIssueInput {
  title?: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  assignedToId?: string | null;
}

export interface IssueFilters {
  search?: string;
  status?: Status;
  priority?: Priority;
  assignedToId?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
