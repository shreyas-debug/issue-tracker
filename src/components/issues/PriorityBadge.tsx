import { cn, PRIORITY_COLORS, PRIORITY_LABELS } from "@/lib/utils";
import { AlertCircle, ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { Priority } from "@/types";

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

const PRIORITY_ICONS: Record<Priority, React.ElementType> = {
  LOW: ArrowDown,
  MEDIUM: Minus,
  HIGH: ArrowUp,
  CRITICAL: AlertCircle,
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const Icon = PRIORITY_ICONS[priority];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        PRIORITY_COLORS[priority],
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
