import { getSession } from "@/lib/auth/session";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Building2, ShieldCheck, User } from "lucide-react";

export const metadata = {
  title: "Settings — IssueTracker",
};

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="space-y-1">
        <Breadcrumbs segments={[{ label: "Settings" }]} />
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Your Account</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{session.name}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{session.email}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium capitalize">
              {session.role.toLowerCase()}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Workspace</CardTitle>
          </div>
          <CardDescription>
            Your isolated tenant context
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Organization</span>
            <span className="font-medium">{session.orgName}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Organization ID</span>
            <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
              {session.orgId}
            </code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Isolation Status</CardTitle>
          </div>
          <CardDescription>
            Tenant isolation is active for your session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              All queries scoped to{" "}
              <strong>{session.orgName}</strong> — cross-tenant
              access is blocked at the data layer
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
