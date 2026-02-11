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
  Sparkles,
  Send,
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
  { title: "New Product", description: "Create a software product", icon: Package, href: "/products", color: "text-blue-500", bg: "bg-blue-500/10" },
  { title: "Generate License", description: "Issue a new license key", icon: Key, href: "/licenses", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { title: "API Keys", description: "Manage your API keys", icon: ShieldCheck, href: "/api-keys", color: "text-violet-500", bg: "bg-violet-500/10" },
  { title: "View Docs", description: "API documentation", icon: FileCode, href: "/docs", color: "text-amber-500", bg: "bg-amber-500/10" },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <Skeleton className="h-28 sm:h-32 w-full rounded-md" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 sm:h-28 rounded-md" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <Skeleton className="h-64 sm:h-72 rounded-md" />
          <Skeleton className="h-64 sm:h-72 rounded-md" />
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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px]">
      <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 sm:p-6 border border-primary/10 animate-fade-in">
        <div className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-violet-500/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
        <div className="relative space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-primary animate-pulse-subtle" />
              <span className="text-xs font-medium text-primary uppercase tracking-wider">Dashboard</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">
              {greeting}, {user?.firstName || "User"}
            </h1>
            <p className="text-muted-foreground mt-1 max-w-md text-sm sm:text-base">
              Manage your software licenses, track activations, and monitor your products.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/products">
              <Button variant="outline" size="sm" data-testid="button-new-product">
                <Plus className="h-4 w-4 mr-1" />
Product
              </Button>
            </Link>
            <Link href="/licenses">
              <Button size="sm" data-testid="button-new-license">
                <Key className="h-4 w-4 mr-1" />
License
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 animate-fade-in stagger-1">
        <StatCard
          title="Products"
          value={stats?.totalProducts ?? 0}
          icon={Package}
          color="blue"
          testId="stat-products"
        />
        <StatCard
          title="Licenses"
          value={stats?.totalLicenses ?? 0}
          icon={Key}
          color="purple"
          testId="stat-licenses"
        />
        <StatCard
          title="Active"
          value={stats?.activeLicenses ?? 0}
          icon={Activity}
          color="green"
          change={stats?.totalLicenses ? `${activePct}%` : undefined}
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
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            title="Activations"
            value={stats?.totalActivations ?? 0}
            icon={Globe}
            color="red"
            testId="stat-activations"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 animate-fade-in stagger-2">
        {quickActions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Card className="p-3 sm:p-4 hover-elevate cursor-pointer h-full" data-testid={`quick-action-${action.title.toLowerCase().replace(/\s/g, "-")}`}>
              <div className="flex items-start justify-between gap-1 mb-1.5 sm:mb-2">
                <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-md ${action.bg} flex items-center justify-center flex-shrink-0`}>
                  <action.icon className={`h-4 w-4 ${action.color}`} />
                </div>
                <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
              <p className="text-xs sm:text-sm font-medium leading-tight">{action.title}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight hidden sm:block">{action.description}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 animate-fade-in stagger-3">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-md bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <Key className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-violet-500" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-sm sm:text-base">Recent Licenses</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Latest issued license keys</p>
              </div>
            </div>
            <Link href="/licenses">
              <Button variant="ghost" size="sm" data-testid="link-view-all-licenses">
                <span className="hidden sm:inline">View All</span>
                <ArrowRight className="h-3.5 w-3.5 sm:ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            {(!stats?.recentLicenses || stats.recentLicenses.length === 0) ? (
              <div className="text-center py-8 sm:py-10">
                <Key className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/30 mx-auto mb-2 sm:mb-3" />
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
                    className="flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 rounded-md hover-elevate"
                    data-testid={`license-row-${license.id}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                        license.status === "active" ? "bg-emerald-500/10" :
                        license.status === "revoked" ? "bg-red-500/10" :
                        "bg-amber-500/10"
                      }`}>
                        <StatusIcon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${config.className}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-mono truncate font-medium">{license.licenseKey}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          {license.productName || license.productId} &middot; {license.customerName || license.customerEmail || "No customer"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">
                      {license.type}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-md bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-sm sm:text-base">Products</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Your software products</p>
              </div>
            </div>
            <Link href="/products">
              <Button variant="ghost" size="sm" data-testid="link-view-all-products">
                <span className="hidden sm:inline">View All</span>
                <ArrowRight className="h-3.5 w-3.5 sm:ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            {(!stats?.recentProducts || stats.recentProducts.length === 0) ? (
              <div className="text-center py-8 sm:py-10">
                <Package className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/30 mx-auto mb-2 sm:mb-3" />
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
                  className="flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 rounded-md hover-elevate"
                  data-testid={`product-row-${product.id}`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                      product.isActive ? "bg-blue-500/10" : "bg-muted"
                    }`}>
                      <Package className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${product.isActive ? "text-blue-500" : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{product.name}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        v{product.version} &middot; {product.slug}
                      </p>
                    </div>
                  </div>
                  <Badge variant={product.isActive ? "default" : "outline"} className="text-[10px] sm:text-xs flex-shrink-0">
                    {product.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 animate-fade-in stagger-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-md bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-sm sm:text-base">Overview</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">License distribution</p>
              </div>
            </div>
            <Link href="/statistics">
              <Button variant="ghost" size="sm" data-testid="link-view-statistics">
                <span className="hidden sm:inline">Full Stats</span>
                <ArrowRight className="h-3.5 w-3.5 sm:ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="text-center p-3 sm:p-4 rounded-md bg-emerald-500/5 border border-emerald-500/10">
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats?.activeLicenses ?? 0}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Active</div>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-md bg-blue-500/5 border border-blue-500/10">
              <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.totalProducts ?? 0}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Products</div>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-md bg-violet-500/5 border border-violet-500/10">
              <div className="text-xl sm:text-2xl font-bold text-violet-600 dark:text-violet-400">{stats?.totalActivations ?? 0}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Activations</div>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-md bg-amber-500/5 border border-amber-500/10">
              <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">{stats?.totalApiKeys ?? 0}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">API Keys</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 relative overflow-visible">
          <div className="absolute inset-0 rounded-md bg-gradient-to-br from-primary/5 via-violet-500/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-md bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary animate-pulse-subtle" />
              </div>
              <div>
                <h2 className="font-semibold text-sm sm:text-base">Upgrade to Pro</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Unlock premium features</p>
              </div>
            </div>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-xs sm:text-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                <span>Unlimited products & licenses</span>
              </li>
              <li className="flex items-center gap-2 text-xs sm:text-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                <span>Priority support & webhooks</span>
              </li>
              <li className="flex items-center gap-2 text-xs sm:text-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                <span>Advanced analytics & reports</span>
              </li>
            </ul>
            <a href="https://t.me/lutaubos" target="_blank" rel="noopener noreferrer">
              <Button className="w-full" data-testid="button-upgrade-telegram">
                <Send className="h-4 w-4 mr-1.5" />
                Contact via Telegram
              </Button>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
