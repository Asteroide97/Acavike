import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardStatCard({
  title,
  value,
  caption,
  icon: Icon,
}: {
  title: string;
  value: string;
  caption: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="admin-surface border-slate-200">
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{caption}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
