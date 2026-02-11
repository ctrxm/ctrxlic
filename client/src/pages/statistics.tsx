import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import { useI18n } from "@/lib/i18n";
import {
  Key,
  Package,
  ShieldCheck,
  Activity,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface StatsData {
  totalProducts: number;
  totalLicenses: number;
  activeLicenses: number;
  revokedLicenses: number;
  expiredLicenses: number;
  totalApiKeys: number;
  totalActivations: number;
  licensesByType: { type: string; count: number }[];
  licensesByStatus: { status: string; count: number }[];
  licensesOverTime: { date: string; count: number }[];
  activationsOverTime: { date: string; count: number }[];
  topProducts: { name: string; licenses: number }[];
}

interface HeatmapEntry {
  day_of_week: number;
  hour: number;
  count: number;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function ValidationHeatmap({ data, t }: { data: HeatmapEntry[]; t: (key: string) => string }) {
  const dayKeys = ["days.sun", "days.mon", "days.tue", "days.wed", "days.thu", "days.fri", "days.sat"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const getCount = (day: number, hour: number): number => {
    const entry = data.find((d) => d.day_of_week === day && d.hour === hour);
    return entry?.count || 0;
  };

  const getColor = (count: number): string => {
    if (count === 0) return "bg-muted/30";
    const intensity = count / maxCount;
    if (intensity < 0.25) return "bg-primary/20";
    if (intensity < 0.5) return "bg-primary/40";
    if (intensity < 0.75) return "bg-primary/60";
    return "bg-primary/90";
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        {t("statistics.noHeatmapData")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex gap-0.5 mb-1 pl-10">
          {hours.filter((_, i) => i % 3 === 0).map((h) => (
            <div
              key={h}
              className="text-[10px] text-muted-foreground"
              style={{ width: `${100 / 8}%`, textAlign: "center" }}
            >
              {h}:00
            </div>
          ))}
        </div>
        {dayKeys.map((dayKey, dayIndex) => (
          <div key={dayKey} className="flex items-center gap-1 mb-0.5">
            <span className="text-[11px] text-muted-foreground w-8 text-right shrink-0">
              {t(dayKey)}
            </span>
            <div className="flex gap-0.5 flex-1">
              {hours.map((hour) => {
                const count = getCount(dayIndex, hour);
                return (
                  <div
                    key={hour}
                    className={`flex-1 h-5 rounded-sm ${getColor(count)} transition-colors`}
                    title={`${t(dayKey)} ${hour}:00 - ${count} validations`}
                    data-testid={`heatmap-cell-${dayIndex}-${hour}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex items-center justify-end gap-2 mt-3">
          <span className="text-[10px] text-muted-foreground">Less</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded-sm bg-muted/30" />
            <div className="w-3 h-3 rounded-sm bg-primary/20" />
            <div className="w-3 h-3 rounded-sm bg-primary/40" />
            <div className="w-3 h-3 rounded-sm bg-primary/60" />
            <div className="w-3 h-3 rounded-sm bg-primary/90" />
          </div>
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  );
}

export default function StatisticsPage() {
  const { t } = useI18n();

  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ["/api/statistics"],
  });

  const { data: heatmapData, isLoading: heatmapLoading } = useQuery<HeatmapEntry[]>({
    queryKey: ["/api/statistics/heatmap"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-md" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-md" />
          <Skeleton className="h-80 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("statistics.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("statistics.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t("dashboard.totalProducts")} value={stats?.totalProducts ?? 0} icon={Package} testId="stat-total-products" />
        <StatCard title={t("dashboard.totalLicenses")} value={stats?.totalLicenses ?? 0} icon={Key} testId="stat-total-licenses" />
        <StatCard
          title={t("dashboard.activeLicenses")}
          value={stats?.activeLicenses ?? 0}
          icon={CheckCircle2}
          trend="up"
          testId="stat-active-licenses"
        />
        <StatCard
          title={t("dashboard.totalActivations")}
          value={stats?.totalActivations ?? 0}
          icon={Activity}
          testId="stat-total-activations"
        />
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-1">{t("statistics.validationHeatmap")}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t("statistics.heatmapDesc")}</p>
        {heatmapLoading ? (
          <Skeleton className="h-48 rounded-md" />
        ) : (
          <ValidationHeatmap data={heatmapData || []} t={t} />
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-4">{t("statistics.licensesByType")}</h3>
          <div className="h-64">
            {stats?.licensesByType && stats.licensesByType.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.licensesByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="type" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No license data available yet
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">{t("statistics.licensesByStatus")}</h3>
          <div className="h-64">
            {stats?.licensesByStatus && stats.licensesByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.licensesByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ status, count }) => `${status}: ${count}`}
                    labelLine={false}
                  >
                    {stats.licensesByStatus.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No status data available yet
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">{t("statistics.topProducts")}</h3>
          <div className="h-64">
            {stats?.topProducts && stats.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="licenses" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No product data available yet
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 p-3 rounded-md bg-background">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-chart-2" />
                <span className="text-sm">{t("licenses.active")}</span>
              </div>
              <span className="font-semibold">{stats?.activeLicenses ?? 0}</span>
            </div>
            <div className="flex items-center justify-between gap-4 p-3 rounded-md bg-background">
              <div className="flex items-center gap-3">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm">{t("licenses.revoked")}</span>
              </div>
              <span className="font-semibold">{stats?.revokedLicenses ?? 0}</span>
            </div>
            <div className="flex items-center justify-between gap-4 p-3 rounded-md bg-background">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-chart-4" />
                <span className="text-sm">{t("licenses.expired")}</span>
              </div>
              <span className="font-semibold">{stats?.expiredLicenses ?? 0}</span>
            </div>
            <div className="flex items-center justify-between gap-4 p-3 rounded-md bg-background">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-sm">{t("nav.apiKeys")}</span>
              </div>
              <span className="font-semibold">{stats?.totalApiKeys ?? 0}</span>
            </div>
            <div className="flex items-center justify-between gap-4 p-3 rounded-md bg-background">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-chart-3" />
                <span className="text-sm">{t("dashboard.totalActivations")}</span>
              </div>
              <span className="font-semibold">{stats?.totalActivations ?? 0}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
