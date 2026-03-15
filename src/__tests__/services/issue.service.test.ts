import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TenantClient } from "@/lib/db/tenant-extension";
import {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
} from "@/services/issue.service";

const makeIssue = (overrides: Record<string, unknown> = {}) => ({
  id: "issue-1",
  title: "Cannot deploy to production",
  description: "Pipeline fails on step 3",
  status: "OPEN",
  priority: "HIGH",
  organizationId: "org-acme",
  assignedToId: null,
  assignedTo: null,
  createdById: "user-1",
  createdBy: { id: "user-1", name: "Alice", email: "alice@acme.com" },
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date("2024-01-15"),
  ...overrides,
});

function createMockDb(): TenantClient {
  return {
    issue: {
      findMany: vi.fn().mockResolvedValue([makeIssue()]),
      findFirst: vi.fn().mockResolvedValue(makeIssue()),
      findUnique: vi.fn().mockResolvedValue(makeIssue()),
      count: vi.fn().mockResolvedValue(1),
      create: vi.fn().mockResolvedValue(makeIssue()),
      update: vi.fn().mockResolvedValue(makeIssue()),
      delete: vi.fn().mockResolvedValue(makeIssue()),
    },
  } as unknown as TenantClient;
}

describe("Issue Service", () => {
  let mockDb: TenantClient;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  // ---------------------------------------------------------------------------
  // getIssues
  // ---------------------------------------------------------------------------
  describe("getIssues", () => {
    it("returns a paginated result with data and metadata", async () => {
      const result = await getIssues(mockDb);

      expect(result).toMatchObject({
        data: expect.any(Array),
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });
    });

    it("calls findMany and count in parallel", async () => {
      await getIssues(mockDb);
      expect(mockDb.issue.findMany).toHaveBeenCalledOnce();
      expect(mockDb.issue.count).toHaveBeenCalledOnce();
    });

    it("applies a status filter to the underlying query", async () => {
      await getIssues(mockDb, { status: "OPEN" });

      expect(mockDb.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "OPEN" }),
        })
      );
    });

    it("applies a priority filter to the underlying query", async () => {
      await getIssues(mockDb, { priority: "CRITICAL" });

      expect(mockDb.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ priority: "CRITICAL" }),
        })
      );
    });

    it("applies a search filter as an OR on title and description", async () => {
      await getIssues(mockDb, { search: "login bug" });

      expect(mockDb.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: "login bug", mode: "insensitive" } },
              { description: { contains: "login bug", mode: "insensitive" } },
            ],
          }),
        })
      );
    });

    it("paginates: page 2 with pageSize 10 skips 10 rows", async () => {
      await getIssues(mockDb, {}, 2, 10);

      expect(mockDb.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 })
      );
    });

    it("calculates totalPages correctly for non-integer division", async () => {
      vi.mocked(mockDb.issue.count).mockResolvedValue(45);

      const result = await getIssues(mockDb, {}, 1, 20);

      expect(result.totalPages).toBe(3); // ceil(45/20) = 3
    });

    it("returns totalPages of 0 when there are no issues", async () => {
      vi.mocked(mockDb.issue.findMany).mockResolvedValue([]);
      vi.mocked(mockDb.issue.count).mockResolvedValue(0);

      const result = await getIssues(mockDb);

      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getIssueById
  // ---------------------------------------------------------------------------
  describe("getIssueById", () => {
    it("returns the issue when it exists in the tenant's scope", async () => {
      const result = await getIssueById(mockDb, "issue-1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("issue-1");
      expect(result?.title).toBe("Cannot deploy to production");
    });

    it("returns null when the issue does not exist (enforces IDOR protection)", async () => {
      vi.mocked(mockDb.issue.findFirst).mockResolvedValue(null);

      const result = await getIssueById(mockDb, "issue-from-another-tenant");

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // createIssue
  // ---------------------------------------------------------------------------
  describe("createIssue", () => {
    it("passes organizationId to the database create call", async () => {
      await createIssue(mockDb, "org-acme", "user-1", {
        title: "New Bug Report",
      });

      expect(mockDb.issue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ organizationId: "org-acme" }),
        })
      );
    });

    it("defaults status to OPEN when not provided", async () => {
      await createIssue(mockDb, "org-acme", "user-1", { title: "Issue" });

      expect(mockDb.issue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "OPEN" }),
        })
      );
    });

    it("defaults priority to MEDIUM when not provided", async () => {
      await createIssue(mockDb, "org-acme", "user-1", { title: "Issue" });

      expect(mockDb.issue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ priority: "MEDIUM" }),
        })
      );
    });

    it("sets createdById to the authenticated user's id", async () => {
      await createIssue(mockDb, "org-acme", "user-abc-789", {
        title: "Issue",
      });

      expect(mockDb.issue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ createdById: "user-abc-789" }),
        })
      );
    });

    it("respects a caller-provided status and priority", async () => {
      await createIssue(mockDb, "org-acme", "user-1", {
        title: "Critical outage",
        status: "IN_PROGRESS",
        priority: "CRITICAL",
      });

      expect(mockDb.issue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "IN_PROGRESS",
            priority: "CRITICAL",
          }),
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // updateIssue
  // ---------------------------------------------------------------------------
  describe("updateIssue", () => {
    it("returns the updated issue on success", async () => {
      const result = await updateIssue(mockDb, "issue-1", {
        title: "Resolved: deploy fix",
        status: "RESOLVED",
      });

      expect(result).not.toBeNull();
    });

    it("returns null when the record does not exist (Prisma throws)", async () => {
      vi.mocked(mockDb.issue.update).mockRejectedValue(
        new Error("Record to update not found")
      );

      const result = await updateIssue(mockDb, "non-existent-id", {
        title: "x",
      });

      expect(result).toBeNull();
    });

    it("only includes fields that are explicitly provided (partial update)", async () => {
      await updateIssue(mockDb, "issue-1", { status: "CLOSED" });

      const callArgs = vi.mocked(mockDb.issue.update).mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(callArgs.data).toHaveProperty("status", "CLOSED");
      expect(callArgs.data).not.toHaveProperty("title");
      expect(callArgs.data).not.toHaveProperty("priority");
    });
  });

  // ---------------------------------------------------------------------------
  // deleteIssue
  // ---------------------------------------------------------------------------
  describe("deleteIssue", () => {
    it("returns true when deletion succeeds", async () => {
      const result = await deleteIssue(mockDb, "issue-1");
      expect(result).toBe(true);
    });

    it("returns false when the issue does not exist (Prisma throws)", async () => {
      vi.mocked(mockDb.issue.delete).mockRejectedValue(
        new Error("Record to delete not found")
      );

      const result = await deleteIssue(mockDb, "issue-ghost");
      expect(result).toBe(false);
    });
  });
});
