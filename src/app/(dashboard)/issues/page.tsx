import { Suspense } from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { createTenantClient } from "@/lib/db/tenant-extension";
import { getIssues } from "@/services/issue.service";
import { IssueTable } from "@/components/issues/IssueTable";
import { IssueFilters } from "@/components/issues/IssueFilters";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Plus, Bug } from "lucide-react";
import type { Status, Priority } from "@/types";

interface IssuesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    priority?: string;
    page?: string;
  }>;
}

export const metadata = {
  title: "Issues — IssueTracker",
};

async function IssueList({
  orgId,
  search,
  status,
  priority,
  page,
}: {
  orgId: string;
  search?: string;
  status?: Status;
  priority?: Priority;
  page: number;
}) {
  const db = createTenantClient(orgId);
  const result = await getIssues(
    db,
    { search, status, priority },
    page,
    20
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {result.total === 0
            ? "No issues"
            : `Showing ${result.data.length} of ${result.total} issue${result.total !== 1 ? "s" : ""}`}
        </p>
      </div>
      <IssueTable issues={result.data} />
      {result.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map(
            (p) => (
              <Link
                key={p}
                href={`?page=${p}`}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                  p === page
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {p}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default async function IssuesPage({ searchParams }: IssuesPageProps) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const status = params.status as Status | undefined;
  const priority = params.priority as Priority | undefined;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Breadcrumbs segments={[{ label: "Issues" }]} />
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-semibold">Issues</h1>
          </div>
        </div>
        <Button asChild>
          <Link href="/issues/new">
            <Plus className="mr-2 h-4 w-4" />
            New Issue
          </Link>
        </Button>
      </div>

      <IssueFilters />

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        }
      >
        <IssueList
          orgId={session.orgId}
          search={params.search}
          status={status}
          priority={priority}
          page={page}
        />
      </Suspense>
    </div>
  );
}
