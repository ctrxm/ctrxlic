import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  color?: "blue" | "green" | "purple" | "orange" | "red";
  testId?: string;
}

const colorMap = {
  blue: {
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    icon: "text-blue-600 dark:text-blue-400",
    accent: "from-blue-500/5 to-transparent",
  },
  green: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    icon: "text-emerald-600 dark:text-emerald-400",
    accent: "from-emerald-500/5 to-transparent",
  },
  purple: {
    bg: "bg-violet-500/10 dark:bg-violet-500/15",
    icon: "text-violet-600 dark:text-violet-400",
    accent: "from-violet-500/5 to-transparent",
  },
  orange: {
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    icon: "text-amber-600 dark:text-amber-400",
    accent: "from-amber-500/5 to-transparent",
  },
  red: {
    bg: "bg-red-500/10 dark:bg-red-500/15",
    icon: "text-red-600 dark:text-red-400",
    accent: "from-red-500/5 to-transparent",
  },
};

export function StatCard({ title, value, change, icon: Icon, trend = "neutral", color = "blue", testId }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <Card className="relative overflow-visible p-3 sm:p-5 hover-elevate" data-testid={testId}>
      <div className={`absolute inset-0 rounded-md bg-gradient-to-br ${colors.accent} pointer-events-none`} />
      <div className="relative flex items-start justify-between gap-2 sm:gap-4">
        <div className="space-y-1 sm:space-y-2 min-w-0">
          <p className="text-[11px] sm:text-sm text-muted-foreground font-medium truncate">{title}</p>
          <p className="text-xl sm:text-3xl font-bold tracking-tight">{value}</p>
          {change && (
            <div className="flex items-center gap-1">
              {trend === "up" && <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500" />}
              {trend === "down" && <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-500" />}
              <p
                className={`text-[10px] sm:text-xs font-medium ${
                  trend === "up"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : trend === "down"
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted-foreground"
                }`}
              >
                {change}
              </p>
            </div>
          )}
        </div>
        <div className={`h-8 w-8 sm:h-11 sm:w-11 rounded-md ${colors.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${colors.icon}`} />
        </div>
      </div>
    </Card>
  );
}
