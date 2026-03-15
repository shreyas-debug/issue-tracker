import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  createIssueSchema,
  updateIssueSchema,
} from "@/lib/validation/schemas";

describe("Validation Schemas", () => {
  // ---------------------------------------------------------------------------
  // loginSchema
  // ---------------------------------------------------------------------------
  describe("loginSchema", () => {
    it("accepts valid email and password", () => {
      const result = loginSchema.safeParse({
        email: "alice@acme.com",
        password: "secret",
      });
      expect(result.success).toBe(true);
    });

    it("rejects a malformed email address", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "secret",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("Invalid email address");
    });

    it("rejects an empty password", () => {
      const result = loginSchema.safeParse({
        email: "alice@acme.com",
        password: "",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("Password is required");
    });

    it("rejects missing fields", () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // registerSchema
  // ---------------------------------------------------------------------------
  describe("registerSchema", () => {
    const valid = {
      name: "Alice Smith",
      email: "alice@acme.com",
      password: "securepassword",
      organizationName: "Acme Corp",
    };

    it("accepts a fully valid registration payload", () => {
      expect(registerSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects a name shorter than 2 characters", () => {
      const result = registerSchema.safeParse({ ...valid, name: "A" });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toMatch(/at least 2/i);
    });

    it("rejects a password shorter than 8 characters", () => {
      const result = registerSchema.safeParse({ ...valid, password: "short" });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toMatch(/at least 8/i);
    });

    it("rejects an invalid email format", () => {
      const result = registerSchema.safeParse({
        ...valid,
        email: "bad-email",
      });
      expect(result.success).toBe(false);
    });

    it("rejects an organization name shorter than 2 characters", () => {
      const result = registerSchema.safeParse({
        ...valid,
        organizationName: "X",
      });
      expect(result.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // createIssueSchema
  // ---------------------------------------------------------------------------
  describe("createIssueSchema", () => {
    it("accepts a minimal payload with just a title", () => {
      const result = createIssueSchema.safeParse({ title: "Fix login bug" });
      expect(result.success).toBe(true);
    });

    it("accepts a fully specified payload", () => {
      const result = createIssueSchema.safeParse({
        title: "Deploy failure",
        description: "Pipeline fails at step 3",
        priority: "CRITICAL",
        status: "OPEN",
        assignedToId: "user-123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects an empty title", () => {
      const result = createIssueSchema.safeParse({ title: "" });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("Title is required");
    });

    it("rejects a title exceeding 255 characters", () => {
      const result = createIssueSchema.safeParse({ title: "x".repeat(256) });
      expect(result.success).toBe(false);
    });

    it("rejects an invalid priority value", () => {
      const result = createIssueSchema.safeParse({
        title: "Issue",
        priority: "URGENT",
      });
      expect(result.success).toBe(false);
    });

    it("rejects an invalid status value", () => {
      const result = createIssueSchema.safeParse({
        title: "Issue",
        status: "PENDING",
      });
      expect(result.success).toBe(false);
    });

    it("accepts all valid status enum values", () => {
      const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
      statuses.forEach((status) => {
        const result = createIssueSchema.safeParse({ title: "t", status });
        expect(result.success, `Expected ${status} to be valid`).toBe(true);
      });
    });

    it("accepts all valid priority enum values", () => {
      const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
      priorities.forEach((priority) => {
        const result = createIssueSchema.safeParse({ title: "t", priority });
        expect(result.success, `Expected ${priority} to be valid`).toBe(true);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // updateIssueSchema
  // ---------------------------------------------------------------------------
  describe("updateIssueSchema", () => {
    it("accepts a valid partial update with just id and status", () => {
      const result = updateIssueSchema.safeParse({
        id: "issue-abc",
        status: "RESOLVED",
      });
      expect(result.success).toBe(true);
    });

    it("rejects an update with a missing id", () => {
      const result = updateIssueSchema.safeParse({ status: "RESOLVED" });
      expect(result.success).toBe(false);
    });

    it("rejects an update with an empty id string", () => {
      const result = updateIssueSchema.safeParse({ id: "", title: "Updated" });
      expect(result.success).toBe(false);
    });

    it("accepts null for assignedToId (unassigning a user)", () => {
      const result = updateIssueSchema.safeParse({
        id: "issue-abc",
        assignedToId: null,
      });
      expect(result.success).toBe(true);
    });
  });
});
