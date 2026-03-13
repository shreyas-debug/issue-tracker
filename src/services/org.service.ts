import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/utils";

export async function createOrganization(name: string) {
  const slug = slugify(name);

  const existing = await prisma.organization.findUnique({ where: { slug } });
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  return prisma.organization.create({
    data: { name, slug: finalSlug },
  });
}

export async function getOrganizationBySlug(slug: string) {
  return prisma.organization.findUnique({
    where: { slug },
    include: { _count: { select: { users: true, issues: true } } },
  });
}
