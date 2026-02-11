import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
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
import SamplePage from "@/pages/sample";
import { NotificationsBell } from "@/components/notifications-bell";
import ctrxlLogo from "@/assets/images/ctrxl-logo.png";

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

function SplashScreen() {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-500 ${fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      data-testid="splash-screen"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-2xl animate-pulse" />
          <img
            src={ctrxlLogo}
            alt="CTRXL"
            className="relative h-20 w-20 rounded-2xl object-cover animate-[splash-logo_0.8s_ease-out_forwards]"
          />
        </div>
        <div className="flex flex-col items-center gap-2 animate-[splash-text_0.6s_ease-out_0.3s_both]">
          <span className="text-xl font-bold tracking-tight">CTRXL LICENSE</span>
          <span className="text-xs text-muted-foreground tracking-widest uppercase">Loading</span>
        </div>
        <div className="flex gap-1.5 animate-[splash-text_0.6s_ease-out_0.5s_both]">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-[splash-dot_1.4s_ease-in-out_infinite]" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-[splash-dot_1.4s_ease-in-out_0.2s_infinite]" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-[splash-dot_1.4s_ease-in-out_0.4s_infinite]" />
        </div>
      </div>
    </div>
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

  if (location === "/sample") {
    return <SamplePage />;
  }

  if (isLoading) {
    return <SplashScreen />;
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
