import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SEED_PASSWORD = "password123";
const SALT_ROUNDS = 12;

async function main() {
  console.log("Seeding database...\n");

  await prisma.issue.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);

  // ─── Tenant 1: Acme Corp ───────────────────────────────────────────────────

  const acme = await prisma.organization.create({
    data: { name: "Acme Corp", slug: "acme-corp" },
  });

  const acmeAdmin = await prisma.user.create({
    data: {
      name: "Alice Johnson",
      email: "acme@example.com",
      passwordHash,
      role: "ADMIN",
      organizationId: acme.id,
    },
  });

  const acmeMember = await prisma.user.create({
    data: {
      name: "Bob Martinez",
      email: "bob@acme.example.com",
      passwordHash,
      role: "MEMBER",
      organizationId: acme.id,
    },
  });

  await prisma.issue.createMany({
    data: [
      {
        title: "Payment gateway returns 500 on checkout",
        description:
          "Users are reporting a 500 error when clicking 'Complete Purchase'. Affects Stripe integration. Started after the v2.3.1 deploy.",
        status: "OPEN",
        priority: "CRITICAL",
        organizationId: acme.id,
        createdById: acmeAdmin.id,
        assignedToId: acmeMember.id,
      },
      {
        title: "Refactor authentication module to use PKCE",
        description:
          "Current OAuth flow uses implicit grant which is deprecated. Migrate to authorization code flow with PKCE.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        organizationId: acme.id,
        createdById: acmeAdmin.id,
        assignedToId: acmeAdmin.id,
      },
      {
        title: "Add pagination to user management table",
        description:
          "The /admin/users page renders all users at once. Needs server-side pagination with 25 items per page.",
        status: "OPEN",
        priority: "MEDIUM",
        organizationId: acme.id,
        createdById: acmeMember.id,
        assignedToId: null,
      },
      {
        title: "Update dependencies — Q1 2026",
        description:
          "React 19.2, Next.js 16, and Prisma 7 are all stable. Schedule upgrade window.",
        status: "OPEN",
        priority: "LOW",
        organizationId: acme.id,
        createdById: acmeMember.id,
        assignedToId: acmeMember.id,
      },
      {
        title: "Write end-to-end tests for cart flow",
        description:
          "Playwright suite for add-to-cart → checkout → confirmation. Priority after payment gateway fix.",
        status: "RESOLVED",
        priority: "MEDIUM",
        organizationId: acme.id,
        createdById: acmeAdmin.id,
        assignedToId: acmeMember.id,
      },
    ],
  });

  // ─── Tenant 2: Stark Industries ───────────────────────────────────────────

  const stark = await prisma.organization.create({
    data: { name: "Stark Industries", slug: "stark-industries" },
  });

  const starkAdmin = await prisma.user.create({
    data: {
      name: "Tony Stark",
      email: "stark@example.com",
      passwordHash,
      role: "ADMIN",
      organizationId: stark.id,
    },
  });

  const starkMember = await prisma.user.create({
    data: {
      name: "Pepper Potts",
      email: "pepper@stark.example.com",
      passwordHash,
      role: "MEMBER",
      organizationId: stark.id,
    },
  });

  await prisma.issue.createMany({
    data: [
      {
        title: "Arc reactor telemetry data not syncing to dashboard",
        description:
          "Real-time telemetry from Mark-85 suit is dropping packets. WebSocket reconnection logic needs a backoff strategy.",
        status: "OPEN",
        priority: "CRITICAL",
        organizationId: stark.id,
        createdById: starkAdmin.id,
        assignedToId: starkAdmin.id,
      },
      {
        title: "JARVIS API rate limiting causing 429s on batch requests",
        description:
          "Bulk inference endpoint hits rate limit during peak hours. Need request queuing with exponential backoff.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        organizationId: stark.id,
        createdById: starkAdmin.id,
        assignedToId: starkMember.id,
      },
      {
        title: "Improve board-level security audit logging",
        description:
          "Executive actions (budget approval, R&D access) must be logged with immutable timestamps per SOC2 requirements.",
        status: "OPEN",
        priority: "HIGH",
        organizationId: stark.id,
        createdById: starkMember.id,
        assignedToId: starkAdmin.id,
      },
      {
        title: "Migrate weapons division data to isolated schema",
        description:
          "Classified R&D data must be separated from commercial product tables. Schema migration planned for Q2.",
        status: "OPEN",
        priority: "MEDIUM",
        organizationId: stark.id,
        createdById: starkAdmin.id,
        assignedToId: null,
      },
      {
        title: "Add dark mode to executive portal",
        description:
          "Multiple requests from C-suite. Tailwind CSS already supports it — just needs the toggle and cookie persistence.",
        status: "CLOSED",
        priority: "LOW",
        organizationId: stark.id,
        createdById: starkMember.id,
        assignedToId: starkMember.id,
      },
    ],
  });

  // ─── Summary ─────────────────────────────────────────────────────────────

  console.log("✓ Seed complete.\n");
  console.log("─────────────────────────────────────────");
  console.log("TENANT: Acme Corp");
  console.log(`  Admin:  acme@example.com       / ${SEED_PASSWORD}`);
  console.log(`  Member: bob@acme.example.com   / ${SEED_PASSWORD}`);
  console.log("");
  console.log("TENANT: Stark Industries");
  console.log(`  Admin:  stark@example.com      / ${SEED_PASSWORD}`);
  console.log(`  Member: pepper@stark.example.com / ${SEED_PASSWORD}`);
  console.log("─────────────────────────────────────────");
  console.log("\nVerification: Log in as acme@example.com and stark@example.com");
  console.log("in separate browser sessions. Each tenant sees ONLY their issues.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
