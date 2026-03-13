import { prisma } from "@/lib/db/prisma";
import type { UserDTO } from "@/types";

export async function getUsersByOrg(orgId: string): Promise<UserDTO[]> {
  return prisma.user.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      organizationId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  }) as unknown as UserDTO[];
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
      organizationId: true,
      organization: {
        select: { id: true, name: true, slug: true },
      },
    },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      organizationId: true,
      organization: {
        select: { id: true, name: true, slug: true },
      },
    },
  });
}
