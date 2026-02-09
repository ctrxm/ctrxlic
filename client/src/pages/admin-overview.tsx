import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import {
  Users,
  Key,
  Package,
  ShieldCheck,
  Activity,
  Shield,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalLicenses: number;
  activeLicenses: number;
  revokedLicenses: number;
  expiredLicenses: number;
  totalApiKeys: number;
  totalActivations: number;
  adminUsers: number;
}

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && user.role !== "admin") setLocation("/dashboard");
  }, [user, setLocation]);

  if (!user || user.role !== "admin") return null;

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-[1400px]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
          <p className="text-muted-foreground mt-1">System-wide statistics and platform health</p>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-admin-overview-title">Admin Overview</h1>
        <p className="text-muted-foreground mt-1">System-wide statistics and platform health</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          testId="stat-total-users"
        />
        <StatCard
          title="Admin Users"
          value={stats?.adminUsers ?? 0}
          icon={Shield}
          testId="stat-admin-users"
        />
        <StatCard
          title="Total Products"
          value={stats?.totalProducts ?? 0}
          icon={Package}
          testId="stat-total-products"
        />
        <StatCard
          title="Total Licenses"
          value={stats?.totalLicenses ?? 0}
          icon={Key}
          testId="stat-total-licenses"
        />
        <StatCard
          title="Active Licenses"
          value={stats?.activeLicenses ?? 0}
          icon={Activity}
          trend="up"
          testId="stat-active-licenses"
        />
        <StatCard
          title="Revoked Licenses"
          value={stats?.revokedLicenses ?? 0}
          icon={XCircle}
          trend="down"
          testId="stat-revoked-licenses"
        />
        <StatCard
          title="Expired Licenses"
          value={stats?.expiredLicenses ?? 0}
          icon={AlertCircle}
          testId="stat-expired-licenses"
        />
        <StatCard
          title="Total API Keys"
          value={stats?.totalApiKeys ?? 0}
          icon={ShieldCheck}
          testId="stat-total-api-keys"
        />
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Platform Summary</h3>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Total Activations</p>
            <p className="text-xl font-bold" data-testid="text-total-activations">{stats?.totalActivations ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">License Utilization</p>
            <p className="text-xl font-bold" data-testid="text-license-utilization">
              {stats?.totalLicenses ? Math.round(((stats?.activeLicenses ?? 0) / stats.totalLicenses) * 100) : 0}%
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Licenses/User</p>
            <p className="text-xl font-bold" data-testid="text-avg-licenses">
              {stats?.totalUsers ? (stats.totalLicenses / stats.totalUsers).toFixed(1) : "0"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
