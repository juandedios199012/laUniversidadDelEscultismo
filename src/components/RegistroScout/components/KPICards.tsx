/**
 * KPI Cards Component for Scout Statistics
 */

import { LucideIcon, Users, UserCheck, UserPlus, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
  loading?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const colorClasses = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  yellow: "bg-yellow-100 text-yellow-600",
  red: "bg-red-100 text-red-600",
  purple: "bg-purple-100 text-purple-600",
};

export function KPICard({
  title,
  value,
  icon: Icon,
  color = "blue",
  loading = false,
  trend,
}: KPICardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-lg", colorClasses[color])}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {trend && (
              <p
                className={cn(
                  "text-xs",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface KPIGridProps {
  stats: {
    total: number;
    activos: number;
    nuevos: number;
    dirigentes: number;
  } | null;
  loading?: boolean;
}

export function KPIGrid({ stats, loading = false }: KPIGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KPICard
        title="Total Scouts"
        value={stats?.total ?? 0}
        icon={Users}
        color="blue"
        loading={loading}
      />
      <KPICard
        title="Activos"
        value={stats?.activos ?? 0}
        icon={UserCheck}
        color="green"
        loading={loading}
      />
      <KPICard
        title="Nuevos (12 meses)"
        value={stats?.nuevos ?? 0}
        icon={UserPlus}
        color="yellow"
        loading={loading}
      />
      <KPICard
        title="Dirigentes"
        value={stats?.dirigentes ?? 0}
        icon={Shield}
        color="purple"
        loading={loading}
      />
    </div>
  );
}
