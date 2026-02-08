import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
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

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function StatisticsPage() {
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ["/api/statistics"],
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
        <h1 className="text-2xl font-bold tracking-tight">Statistics</h1>
        <p className="text-muted-foreground mt-1">
          Analytics and insights for your license management
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Products" value={stats?.totalProducts ?? 0} icon={Package} testId="stat-total-products" />
        <StatCard title="Total Licenses" value={stats?.totalLicenses ?? 0} icon={Key} testId="stat-total-licenses" />
        <StatCard
          title="Active Licenses"
          value={stats?.activeLicenses ?? 0}
          icon={CheckCircle2}
          trend="up"
          testId="stat-active-licenses"
        />
        <StatCard
          title="Total Activations"
          value={stats?.totalActivations ?? 0}
          icon={Activity}
          testId="stat-total-activations"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Licenses by Type</h3>
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
          <h3 className="font-semibold mb-4">License Status Distribution</h3>
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
          <h3 className="font-semibold mb-4">Top Products by Licenses</h3>
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
                <span className="text-sm">Active Licenses</span>
              </div>
              <span className="font-semibold">{stats?.activeLicenses ?? 0}</span>
            </div>
            <div className="flex items-center justify-between gap-4 p-3 rounded-md bg-background">
              <div className="flex items-center gap-3">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm">Revoked Licenses</span>
              </div>
              <span className="font-semibold">{stats?.revokedLicenses ?? 0}</span>
            </div>
            <div className="flex items-center justify-between gap-4 p-3 rounded-md bg-background">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-chart-4" />
                <span className="text-sm">Expired Licenses</span>
              </div>
              <span className="font-semibold">{stats?.expiredLicenses ?? 0}</span>
            </div>
            <div className="flex items-center justify-between gap-4 p-3 rounded-md bg-background">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-sm">API Keys</span>
              </div>
              <span className="font-semibold">{stats?.totalApiKeys ?? 0}</span>
            </div>
            <div className="flex items-center justify-between gap-4 p-3 rounded-md bg-background">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-chart-3" />
                <span className="text-sm">Activations</span>
              </div>
              <span className="font-semibold">{stats?.totalActivations ?? 0}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
