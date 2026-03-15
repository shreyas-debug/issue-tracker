import { describe, it, expect } from "vitest";
import {
  slugify,
  formatDate,
  formatRelativeTime,
  STATUS_LABELS,
  PRIORITY_LABELS,
  STATUS_COLORS,
  PRIORITY_COLORS,
} from "@/lib/utils";

describe("Utility Functions", () => {
  // ---------------------------------------------------------------------------
  // slugify
  // ---------------------------------------------------------------------------
  describe("slugify", () => {
    it("lowercases and hyphenates a basic string", () => {
      expect(slugify("Acme Corp")).toBe("acme-corp");
    });

    it("trims leading and trailing whitespace", () => {
      expect(slugify("  hello world  ")).toBe("hello-world");
    });

    it("removes special characters", () => {
      expect(slugify("Hello, World!")).toBe("hello-world");
    });

    it("collapses multiple spaces into a single hyphen", () => {
      expect(slugify("foo   bar")).toBe("foo-bar");
    });

    it("handles already-slugified input without modification", () => {
      expect(slugify("acme-corp")).toBe("acme-corp");
    });

    it("handles an empty string", () => {
      expect(slugify("")).toBe("");
    });

    it("removes leading and trailing hyphens", () => {
      expect(slugify("-hello-")).toBe("hello");
    });
  });

  // ---------------------------------------------------------------------------
  // formatDate
  // ---------------------------------------------------------------------------
  describe("formatDate", () => {
    it("formats a Date object to a readable string", () => {
      const result = formatDate(new Date("2024-06-15"));
      expect(result).toMatch(/Jun/);
      expect(result).toMatch(/2024/);
    });

    it("accepts a date string and formats it", () => {
      const result = formatDate("2024-01-01");
      expect(result).toMatch(/Jan/);
      expect(result).toMatch(/2024/);
    });

    it("includes the day in the output", () => {
      const result = formatDate(new Date("2024-03-05"));
      expect(result).toMatch(/5/);
    });
  });

  // ---------------------------------------------------------------------------
  // formatRelativeTime
  // ---------------------------------------------------------------------------
  describe("formatRelativeTime", () => {
    it("returns 'Today' for a date within the last 24 hours", () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe("Today");
    });

    it("returns 'Yesterday' for a date exactly 1 day ago", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatRelativeTime(yesterday)).toBe("Yesterday");
    });

    it("returns '<n> days ago' for a date 3 days ago", () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      expect(formatRelativeTime(threeDaysAgo)).toBe("3 days ago");
    });

    it("returns '<n> weeks ago' for a date 2 weeks ago", () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      expect(formatRelativeTime(twoWeeksAgo)).toBe("2 weeks ago");
    });

    it("falls back to formatDate for dates older than 30 days", () => {
      const oldDate = new Date("2023-01-01");
      const result = formatRelativeTime(oldDate);
      expect(result).toMatch(/Jan/);
      expect(result).toMatch(/2023/);
    });
  });

  // ---------------------------------------------------------------------------
  // Status and Priority label/color maps
  // ---------------------------------------------------------------------------
  describe("STATUS_LABELS", () => {
    it("covers all four status values", () => {
      expect(STATUS_LABELS.OPEN).toBe("Open");
      expect(STATUS_LABELS.IN_PROGRESS).toBe("In Progress");
      expect(STATUS_LABELS.RESOLVED).toBe("Resolved");
      expect(STATUS_LABELS.CLOSED).toBe("Closed");
    });
  });

  describe("PRIORITY_LABELS", () => {
    it("covers all four priority values", () => {
      expect(PRIORITY_LABELS.LOW).toBe("Low");
      expect(PRIORITY_LABELS.MEDIUM).toBe("Medium");
      expect(PRIORITY_LABELS.HIGH).toBe("High");
      expect(PRIORITY_LABELS.CRITICAL).toBe("Critical");
    });
  });

  describe("STATUS_COLORS", () => {
    it("provides a CSS class string for every status", () => {
      const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
      statuses.forEach((s) => {
        expect(STATUS_COLORS[s]).toBeTruthy();
        expect(typeof STATUS_COLORS[s]).toBe("string");
      });
    });
  });

  describe("PRIORITY_COLORS", () => {
    it("provides a CSS class string for every priority", () => {
      const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
      priorities.forEach((p) => {
        expect(PRIORITY_COLORS[p]).toBeTruthy();
        expect(typeof PRIORITY_COLORS[p]).toBe("string");
      });
    });
  });
});
