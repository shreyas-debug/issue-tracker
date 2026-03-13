import Link from "next/link";
import { Bug, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TenantBadge } from "./TenantBadge";
import { logoutAction } from "@/actions/auth.actions";
import type { SessionPayload } from "@/types";

interface AppSidebarProps {
  session: SessionPayload;
}

const NAV_ITEMS = [
  { label: "Issues", href: "/issues", icon: Bug },
  { label: "Settings", href: "/settings", icon: Settings },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AppSidebar({ session }: AppSidebarProps) {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary))]">
          <Bug className="h-4 w-4 text-[hsl(var(--primary-foreground))]" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">IssueTracker</p>
          <p className="text-[11px] text-[hsl(var(--sidebar-foreground))/60] leading-tight opacity-60">
            Issue Management
          </p>
        </div>
      </div>

      {/* Tenant badge */}
      <div className="px-3 pt-4 pb-2">
        <TenantBadge orgName={session.orgName} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider opacity-50">
          Navigation
        </p>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
          >
            <item.icon className="h-4 w-4 shrink-0 opacity-70" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t p-3 space-y-3">
        <div className="flex items-center gap-3 px-1">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-xs font-semibold">
              {getInitials(session.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session.name}</p>
            <p className="text-xs opacity-60 truncate">{session.email}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm opacity-70 hover:opacity-100 hover:bg-[hsl(var(--sidebar-accent))] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
