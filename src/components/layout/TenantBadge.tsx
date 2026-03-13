import { Building2 } from "lucide-react";

interface TenantBadgeProps {
  orgName: string;
  className?: string;
}

export function TenantBadge({ orgName, className }: TenantBadgeProps) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/0.5)] px-3 py-2 ${className ?? ""}`}
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[hsl(var(--primary))]">
        <Building2 className="h-3.5 w-3.5 text-[hsl(var(--primary-foreground))]" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold truncate leading-tight">
          {orgName}
        </span>
        <span className="text-[10px] opacity-50 leading-tight">
          Active Workspace
        </span>
      </div>
    </div>
  );
}
