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
  Zap,
  Globe,
  FileCode,
  ArrowUpRight,
  BarChart3,
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

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string; badgeClass: string }> = {
  active: { label: "Active", icon: CheckCircle2, className: "text-emerald-500", badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  expired: { label: "Expired", icon: Clock, className: "text-amber-500", badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  revoked: { label: "Revoked", icon: XCircle, className: "text-red-500", badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400" },
  suspended: { label: "Suspended", icon: AlertCircle, className: "text-amber-500", badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

const quickActions = [
  { title: "New Product", description: "Create a software product", icon: Package, href: "/products", color: "text-blue-500" },
  { title: "Generate License", description: "Issue a new license key", icon: Key, href: "/licenses", color: "text-emerald-500" },
  { title: "API Keys", description: "Manage your API keys", icon: ShieldCheck, href: "/api-keys", color: "text-violet-500" },
  { title: "View Docs", description: "API documentation", icon: FileCode, href: "/docs", color: "text-amber-500" },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32 w-full rounded-md" />
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

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  const activePct = stats?.totalLicenses
    ? Math.round(((stats.activeLicenses ?? 0) / stats.totalLicenses) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 border border-primary/10 animate-fade-in">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wider">Dashboard</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">
              {greeting}, {user?.firstName || "User"}
            </h1>
            <p className="text-muted-foreground mt-1 max-w-md">
              Manage your software licenses, track activations, and monitor your products all in one place.
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in stagger-1">
        <StatCard
          title="Total Products"
          value={stats?.totalProducts ?? 0}
          icon={Package}
          color="blue"
          testId="stat-products"
        />
        <StatCard
          title="Total Licenses"
          value={stats?.totalLicenses ?? 0}
          icon={Key}
          color="purple"
          testId="stat-licenses"
        />
        <StatCard
          title="Active Licenses"
          value={stats?.activeLicenses ?? 0}
          icon={Activity}
          color="green"
          change={stats?.totalLicenses ? `${activePct}% of total` : undefined}
          trend="up"
          testId="stat-active"
        />
        <StatCard
          title="API Keys"
          value={stats?.totalApiKeys ?? 0}
          icon={ShieldCheck}
          color="orange"
          testId="stat-apikeys"
        />
        <StatCard
          title="Activations"
          value={stats?.totalActivations ?? 0}
          icon={Globe}
          color="red"
          testId="stat-activations"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in stagger-2">
        {quickActions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Card className="p-4 hover-elevate cursor-pointer" data-testid={`quick-action-${action.title.toLowerCase().replace(/\s/g, "-")}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <action.icon className={`h-5 w-5 ${action.color}`} />
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">{action.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 animate-fade-in stagger-3">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-violet-500/10 flex items-center justify-center">
                <Key className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <h2 className="font-semibold">Recent Licenses</h2>
                <p className="text-xs text-muted-foreground">Latest issued license keys</p>
              </div>
            </div>
            <Link href="/licenses">
              <Button variant="ghost" size="sm" data-testid="link-view-all-licenses">
                View All
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {(!stats?.recentLicenses || stats.recentLicenses.length === 0) ? (
              <div className="text-center py-10">
                <Key className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No licenses yet</p>
                <p className="text-xs text-muted-foreground mt-1">Generate your first license to get started</p>
                <Link href="/licenses">
                  <Button variant="outline" size="sm" className="mt-3">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Create License
                  </Button>
                </Link>
              </div>
            ) : (
              stats.recentLicenses.slice(0, 5).map((license) => {
                const config = statusConfig[license.status] || statusConfig.active;
                const StatusIcon = config.icon;
                return (
                  <div
                    key={license.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-md hover-elevate"
                    data-testid={`license-row-${license.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                        license.status === "active" ? "bg-emerald-500/10" :
                        license.status === "revoked" ? "bg-red-500/10" :
                        "bg-amber-500/10"
                      }`}>
                        <StatusIcon className={`h-4 w-4 ${config.className}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-mono truncate font-medium">{license.licenseKey}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {license.productName || license.productId} &middot; {license.customerName || license.customerEmail || "No customer"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        {license.type}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <h2 className="font-semibold">Products</h2>
                <p className="text-xs text-muted-foreground">Your software products</p>
              </div>
            </div>
            <Link href="/products">
              <Button variant="ghost" size="sm" data-testid="link-view-all-products">
                View All
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {(!stats?.recentProducts || stats.recentProducts.length === 0) ? (
              <div className="text-center py-10">
                <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No products yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create your first product to get started</p>
                <Link href="/products">
                  <Button variant="outline" size="sm" className="mt-3">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Create Product
                  </Button>
                </Link>
              </div>
            ) : (
              stats.recentProducts.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-md hover-elevate"
                  data-testid={`product-row-${product.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                      product.isActive ? "bg-blue-500/10" : "bg-muted"
                    }`}>
                      <Package className={`h-4 w-4 ${product.isActive ? "text-blue-500" : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        v{product.version} &middot; {product.slug}
                      </p>
                    </div>
                  </div>
                  <Badge variant={product.isActive ? "default" : "outline"} className="text-xs flex-shrink-0">
                    {product.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5 animate-fade-in stagger-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Overview</h2>
              <p className="text-xs text-muted-foreground">License distribution summary</p>
            </div>
          </div>
          <Link href="/statistics">
            <Button variant="ghost" size="sm" data-testid="link-view-statistics">
              Full Stats
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-md bg-emerald-500/5 border border-emerald-500/10">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats?.activeLicenses ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Active</div>
          </div>
          <div className="text-center p-4 rounded-md bg-blue-500/5 border border-blue-500/10">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.totalProducts ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Products</div>
          </div>
          <div className="text-center p-4 rounded-md bg-violet-500/5 border border-violet-500/10">
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{stats?.totalActivations ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Activations</div>
          </div>
          <div className="text-center p-4 rounded-md bg-amber-500/5 border border-amber-500/10">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats?.totalApiKeys ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">API Keys</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
