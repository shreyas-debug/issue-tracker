import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { createTenantClient } from "@/lib/db/tenant-extension";
import { getIssueById } from "@/services/issue.service";
import { getUsersByOrg } from "@/services/user.service";
import { IssueForm } from "@/components/issues/IssueForm";
import { StatusBadge } from "@/components/issues/StatusBadge";
import { PriorityBadge } from "@/components/issues/PriorityBadge";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { Pencil } from "lucide-react";

interface IssueDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function IssueDetailPage({
  params,
  searchParams,
}: IssueDetailPageProps) {
  const session = await getSession();
  if (!session) return null;

  const { id } = await params;
  const { edit } = await searchParams;
  const isEditing = edit === "true";

  const db = createTenantClient(session.orgId);
  const [issue, members] = await Promise.all([
    getIssueById(db, id),
    getUsersByOrg(session.orgId),
  ]);

  if (!issue) notFound();

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="space-y-1">
        <Breadcrumbs
          segments={[
            { label: "Issues", href: "/issues" },
            { label: issue.title },
          ]}
        />
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Issue</CardTitle>
            <CardDescription>
              Scoped to{" "}
              <strong className="text-foreground">{session.orgName}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IssueForm issue={issue} members={members} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold leading-tight">
                {issue.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={issue.status} />
                <PriorityBadge priority={issue.priority} />
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/issues/${issue.id}?edit=true`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>

          <Separator />

          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Assigned to
                </CardTitle>
              </CardHeader>
              <CardContent>
                {issue.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {getInitials(issue.assignedTo.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {issue.assignedTo.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {issue.assignedTo.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Unassigned</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Created by
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {getInitials(issue.createdBy.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {issue.createdBy.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(issue.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {issue.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {issue.description}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="text-xs text-muted-foreground">
            Last updated {formatDate(issue.updatedAt)} · Workspace:{" "}
            <span className="font-medium text-foreground">
              {session.orgName}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
