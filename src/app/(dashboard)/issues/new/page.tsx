import { getSession } from "@/lib/auth/session";
import { getUsersByOrg } from "@/services/user.service";
import { IssueForm } from "@/components/issues/IssueForm";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "New Issue — IssueTracker",
};

export default async function NewIssuePage() {
  const session = await getSession();
  if (!session) return null;

  const members = await getUsersByOrg(session.orgId);

  return (
    <div className="p-6 max-w-2xl">
      <div className="space-y-1 mb-6">
        <Breadcrumbs
          segments={[
            { label: "Issues", href: "/issues" },
            { label: "New Issue" },
          ]}
        />
        <h1 className="text-xl font-semibold">Create Issue</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Issue</CardTitle>
          <CardDescription>
            Issues are scoped to{" "}
            <strong className="text-foreground">{session.orgName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IssueForm members={members} />
        </CardContent>
      </Card>
    </div>
  );
}
