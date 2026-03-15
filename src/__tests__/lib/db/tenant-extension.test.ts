import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the Tenant Isolation Engine.
 *
 * Strategy: mock prisma.$extends to capture the extension configuration,
 * then invoke the interceptor handlers directly with controlled args.
 * This verifies that organizationId is unconditionally injected into every
 * query operation without requiring a live database connection.
 */

let capturedExtension: Record<string, unknown> | null = null;

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $extends: vi.fn((config: unknown) => {
      capturedExtension = config as Record<string, unknown>;
      return {};
    }),
  },
}));

import { createTenantClient } from "@/lib/db/tenant-extension";
import { prisma } from "@/lib/db/prisma";

const ORG_ID = "org-acme-test-123";

// Helper to get the captured issue query handlers
function getHandlers() {
  const ext = capturedExtension as {
    query: { issue: Record<string, Function> };
  };
  return ext.query.issue;
}

describe("Tenant Isolation Engine - createTenantClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedExtension = null;
  });

  it("registers a Prisma query extension on client creation", () => {
    createTenantClient(ORG_ID);
    expect(prisma.$extends).toHaveBeenCalledOnce();
    expect(capturedExtension).not.toBeNull();
  });

  it("registers interceptors for all write and read operations", () => {
    createTenantClient(ORG_ID);
    const handlers = getHandlers();
    const expectedOps = [
      "findMany",
      "findFirst",
      "findFirstOrThrow",
      "findUnique",
      "findUniqueOrThrow",
      "update",
      "updateMany",
      "delete",
      "deleteMany",
      "count",
    ];
    expectedOps.forEach((op) => {
      expect(handlers[op], `Missing interceptor for: ${op}`).toBeDefined();
    });
  });

  describe("findMany", () => {
    it("injects organizationId into an empty where clause", async () => {
      createTenantClient(ORG_ID);
      const mockQuery = vi.fn().mockResolvedValue([]);

      await getHandlers().findMany({ args: { where: {} }, query: mockQuery });

      expect(mockQuery).toHaveBeenCalledWith({
        where: { organizationId: ORG_ID },
      });
    });

    it("merges organizationId with existing filter conditions", async () => {
      createTenantClient(ORG_ID);
      const mockQuery = vi.fn().mockResolvedValue([]);

      await getHandlers().findMany({
        args: { where: { status: "OPEN", priority: "HIGH" } },
        query: mockQuery,
      });

      expect(mockQuery).toHaveBeenCalledWith({
        where: { status: "OPEN", priority: "HIGH", organizationId: ORG_ID },
      });
    });

    it("overwrites a caller-supplied organizationId to prevent spoofing", async () => {
      createTenantClient(ORG_ID);
      const mockQuery = vi.fn().mockResolvedValue([]);

      await getHandlers().findMany({
        args: { where: { organizationId: "org-malicious-tenant" } },
        query: mockQuery,
      });

      expect(mockQuery).toHaveBeenCalledWith({
        where: { organizationId: ORG_ID },
      });
    });
  });

  describe("findFirst", () => {
    it("injects organizationId - prevents fetching another tenant's record by id", async () => {
      createTenantClient(ORG_ID);
      const mockQuery = vi.fn().mockResolvedValue(null);

      await getHandlers().findFirst({
        args: { where: { id: "issue-from-another-tenant" } },
        query: mockQuery,
      });

      expect(mockQuery).toHaveBeenCalledWith({
        where: { id: "issue-from-another-tenant", organizationId: ORG_ID },
      });
    });
  });

  describe("update", () => {
    it("injects organizationId into update where clause", async () => {
      createTenantClient(ORG_ID);
      const mockQuery = vi.fn().mockResolvedValue({});

      await getHandlers().update({
        args: { where: { id: "issue-abc" }, data: { title: "Updated Title" } },
        query: mockQuery,
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "issue-abc",
            organizationId: ORG_ID,
          }),
        })
      );
    });
  });

  describe("delete", () => {
    it("injects organizationId into delete where clause", async () => {
      createTenantClient(ORG_ID);
      const mockQuery = vi.fn().mockResolvedValue({});

      await getHandlers().delete({
        args: { where: { id: "issue-to-delete" } },
        query: mockQuery,
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: ORG_ID }),
        })
      );
    });
  });

  describe("deleteMany", () => {
    it("scopes bulk deletes to the tenant - cannot delete across tenants", async () => {
      createTenantClient(ORG_ID);
      const mockQuery = vi.fn().mockResolvedValue({ count: 0 });

      await getHandlers().deleteMany({
        args: { where: { status: "CLOSED" } },
        query: mockQuery,
      });

      expect(mockQuery).toHaveBeenCalledWith({
        where: { status: "CLOSED", organizationId: ORG_ID },
      });
    });
  });

  describe("count", () => {
    it("scopes count queries to the tenant's data only", async () => {
      createTenantClient(ORG_ID);
      const mockQuery = vi.fn().mockResolvedValue(3);

      await getHandlers().count({
        args: { where: {} },
        query: mockQuery,
      });

      expect(mockQuery).toHaveBeenCalledWith({
        where: { organizationId: ORG_ID },
      });
    });
  });

  describe("Cross-tenant isolation", () => {
    it("two clients with different orgIds are fully independent", async () => {
      const ORG_A = "org-acme";
      const ORG_B = "org-stark";
      let extA: typeof capturedExtension = null;
      let extB: typeof capturedExtension = null;

      vi.mocked(prisma.$extends)
        .mockImplementationOnce((cfg: unknown) => {
          extA = cfg as Record<string, unknown>;
          return {};
        })
        .mockImplementationOnce((cfg: unknown) => {
          extB = cfg as Record<string, unknown>;
          return {};
        });

      createTenantClient(ORG_A);
      createTenantClient(ORG_B);

      const mockA = vi.fn().mockResolvedValue([]);
      const mockB = vi.fn().mockResolvedValue([]);

      const handlersA = (extA as { query: { issue: Record<string, Function> } })
        .query.issue;
      const handlersB = (extB as { query: { issue: Record<string, Function> } })
        .query.issue;

      await handlersA.findMany({ args: { where: {} }, query: mockA });
      await handlersB.findMany({ args: { where: {} }, query: mockB });

      expect(mockA).toHaveBeenCalledWith({ where: { organizationId: ORG_A } });
      expect(mockB).toHaveBeenCalledWith({ where: { organizationId: ORG_B } });
    });
  });
});
