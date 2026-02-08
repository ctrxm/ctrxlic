import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import {
  Key,
  Package,
  ShieldCheck,
  Activity,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import type { License, Product } from "@shared/schema";

interface DashboardStats {
  totalProducts: number;
  totalLicenses: number;
  activeLicenses: number;
  totalApiKeys: number;
  totalActivations: number;
  recentLicenses: (License & { productName?: string })[];
  recentProducts: Product[];
}

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  active: { label: "Active", icon: CheckCircle2, className: "text-chart-2" },
  expired: { label: "Expired", icon: Clock, className: "text-chart-4" },
  revoked: { label: "Revoked", icon: XCircle, className: "text-destructive" },
  suspended: { label: "Suspended", icon: AlertCircle, className: "text-chart-4" },
};

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-md" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-md" />
          <Skeleton className="h-72 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">
            Welcome back, {user?.firstName || "User"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your license management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/products">
            <Button variant="outline" data-testid="button-new-product">
              <Plus className="h-4 w-4 mr-1" />
              New Product
            </Button>
          </Link>
          <Link href="/licenses">
            <Button data-testid="button-new-license">
              <Key className="h-4 w-4 mr-1" />
              Generate License
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={stats?.totalProducts ?? 0}
          icon={Package}
          testId="stat-products"
        />
        <StatCard
          title="Total Licenses"
          value={stats?.totalLicenses ?? 0}
          icon={Key}
          testId="stat-licenses"
        />
        <StatCard
          title="Active Licenses"
          value={stats?.activeLicenses ?? 0}
          icon={Activity}
          trend="up"
          testId="stat-active"
        />
        <StatCard
          title="API Keys"
          value={stats?.totalApiKeys ?? 0}
          icon={ShieldCheck}
          testId="stat-apikeys"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-semibold">Recent Licenses</h2>
            <Link href="/licenses">
              <Button variant="ghost" size="sm" data-testid="link-view-all-licenses">
                View All
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {(!stats?.recentLicenses || stats.recentLicenses.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No licenses yet. Generate your first license to get started.
              </div>
            ) : (
              stats.recentLicenses.slice(0, 5).map((license) => {
                const config = statusConfig[license.status] || statusConfig.active;
                const StatusIcon = config.icon;
                return (
                  <div
                    key={license.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-md bg-background"
                    data-testid={`license-row-${license.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusIcon className={`h-4 w-4 flex-shrink-0 ${config.className}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-mono truncate">{license.licenseKey}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {license.productName || license.productId} &middot; {license.customerName || license.customerEmail || "No customer"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {license.type}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-semibold">Products</h2>
            <Link href="/products">
              <Button variant="ghost" size="sm" data-testid="link-view-all-products">
                View All
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {(!stats?.recentProducts || stats.recentProducts.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No products yet. Create your first product to get started.
              </div>
            ) : (
              stats.recentProducts.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-md bg-background"
                  data-testid={`product-row-${product.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        v{product.version} &middot; {product.slug}
                      </p>
                    </div>
                  </div>
                  <Badge variant={product.isActive ? "secondary" : "outline"} className="text-xs flex-shrink-0">
                    {product.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
