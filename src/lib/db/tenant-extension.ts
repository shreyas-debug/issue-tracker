import { prisma } from "./prisma";

/**
 * Creates a tenant-scoped Prisma client using Prisma Extensions.
 *
 * This is the core of the isolation engine. By extending the base client,
 * every query operation on the Issue model automatically has the organizationId
 * filter injected — making it impossible for a developer to accidentally leak
 * cross-tenant data even if they forget to add the filter manually.
 *
 * This pattern enforces isolation at the data-access layer, not just the
 * business logic layer, providing defense in depth.
 */
export function createTenantClient(orgId: string) {
  return prisma.$extends({
    query: {
      issue: {
        async findMany({ args, query }) {
          args.where = { ...args.where, organizationId: orgId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, organizationId: orgId };
          return query(args);
        },
        async findFirstOrThrow({ args, query }) {
          args.where = { ...args.where, organizationId: orgId };
          return query(args);
        },
        async findUnique({ args, query }) {
          (args.where as Record<string, unknown>).organizationId = orgId;
          return query(args);
        },
        async findUniqueOrThrow({ args, query }) {
          (args.where as Record<string, unknown>).organizationId = orgId;
          return query(args);
        },
        async update({ args, query }) {
          args.where = { ...args.where, organizationId: orgId } as typeof args.where;
          return query(args);
        },
        async updateMany({ args, query }) {
          args.where = { ...args.where, organizationId: orgId };
          return query(args);
        },
        async delete({ args, query }) {
          args.where = { ...args.where, organizationId: orgId } as typeof args.where;
          return query(args);
        },
        async deleteMany({ args, query }) {
          args.where = { ...args.where, organizationId: orgId };
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, organizationId: orgId };
          return query(args);
        },
      },
    },
  });
}

export type TenantClient = ReturnType<typeof createTenantClient>;
