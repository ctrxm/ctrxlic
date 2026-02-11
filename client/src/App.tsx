import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import AuthPage from "@/pages/auth";
import DashboardPage from "@/pages/dashboard";
import ProductsPage from "@/pages/products";
import LicensesPage from "@/pages/licenses";
import ApiKeysPage from "@/pages/api-keys";
import StatisticsPage from "@/pages/statistics";
import DocsPage from "@/pages/docs";
import DownloadsPage from "@/pages/downloads";
import AdminOverviewPage from "@/pages/admin-overview";
import AdminUsersPage from "@/pages/admin-users";
import AdminLicensesPage from "@/pages/admin-licenses";
import AdminAuditLogsPage from "@/pages/admin-audit-logs";
import AdminSettingsPage from "@/pages/admin-settings";
import InstallPage from "@/pages/install";
import WebhooksPage from "@/pages/webhooks";
import CustomerPortalPage from "@/pages/customer-portal";
import { NotificationsBell } from "@/components/notifications-bell";

function AuthenticatedLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 p-2 border-b bg-background sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-1">
              <NotificationsBell />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <Switch>
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/products" component={ProductsPage} />
              <Route path="/licenses" component={LicensesPage} />
              <Route path="/api-keys" component={ApiKeysPage} />
              <Route path="/statistics" component={StatisticsPage} />
              <Route path="/docs" component={DocsPage} />
              <Route path="/downloads" component={DownloadsPage} />
              <Route path="/webhooks" component={WebhooksPage} />
              <Route path="/admin/overview" component={AdminOverviewPage} />
              <Route path="/admin/users" component={AdminUsersPage} />
              <Route path="/admin/licenses" component={AdminLicensesPage} />
              <Route path="/admin/audit-logs" component={AdminAuditLogsPage} />
              <Route path="/admin/settings" component={AdminSettingsPage} />
              <Route path="/" component={DashboardPage} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (location === "/auth") {
    return <AuthPage />;
  }

  if (location.startsWith("/install/")) {
    return <InstallPage />;
  }

  if (location === "/portal") {
    return <CustomerPortalPage />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-md mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <AuthenticatedLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
