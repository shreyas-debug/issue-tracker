import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  resetRateLimit,
} from "@/lib/security/rate-limiter";

/**
 * Rate limiter tests use unique identifiers per test to avoid shared state
 * between test cases since the module maintains an in-process Map.
 */

describe("Rate Limiter", () => {
  describe("checkRateLimit", () => {
    it("allows the first request", () => {
      const result = checkRateLimit("ip-test-first");
      expect(result.allowed).toBe(true);
    });

    it("tracks remaining attempts correctly", () => {
      const id = "ip-remaining";
      const r1 = checkRateLimit(id);
      const r2 = checkRateLimit(id);
      expect(r1.remaining).toBeGreaterThan(r2.remaining);
    });

    it("blocks after exceeding MAX_ATTEMPTS (5)", () => {
      const id = "ip-exhaust";
      for (let i = 0; i < 5; i++) {
        checkRateLimit(id);
      }
      const result = checkRateLimit(id);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("includes a retryAfter value (seconds) when blocked", () => {
      const id = "ip-retry-after";
      for (let i = 0; i < 6; i++) {
        checkRateLimit(id);
      }
      const result = checkRateLimit(id);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("treats different identifiers as independent windows", () => {
      const idA = "ip-a-independent";
      const idB = "ip-b-independent";

      for (let i = 0; i < 6; i++) checkRateLimit(idA);

      const resultA = checkRateLimit(idA);
      const resultB = checkRateLimit(idB);

      expect(resultA.allowed).toBe(false);
      expect(resultB.allowed).toBe(true);
    });
  });

  describe("resetRateLimit", () => {
    it("resets a blocked identifier so it can attempt again", () => {
      const id = "ip-reset";
      for (let i = 0; i < 6; i++) checkRateLimit(id);

      expect(checkRateLimit(id).allowed).toBe(false);

      resetRateLimit(id);

      expect(checkRateLimit(id).allowed).toBe(true);
    });

    it("is a no-op for an identifier that was never rate limited", () => {
      expect(() => resetRateLimit("ip-never-seen")).not.toThrow();
    });
  });
});
