import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Key,
  Package,
  ShieldCheck,
  BarChart3,
  Code2,
  Settings,
  LogOut,
  Users,
  Download,
  ScrollText,
  PieChart,
  Sparkles,
  Send,
  Webhook,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import ctrxlLogo from "@/assets/images/ctrxl-logo.png";

const mainItems = [
  { titleKey: "nav.dashboard", url: "/dashboard", icon: LayoutDashboard, color: "text-blue-500" },
  { titleKey: "nav.products", url: "/products", icon: Package, color: "text-cyan-500" },
  { titleKey: "nav.licenses", url: "/licenses", icon: Key, color: "text-emerald-500" },
  { titleKey: "nav.apiKeys", url: "/api-keys", icon: ShieldCheck, color: "text-violet-500" },
  { titleKey: "nav.statistics", url: "/statistics", icon: BarChart3, color: "text-amber-500" },
  { titleKey: "nav.apiDocs", url: "/docs", icon: Code2, color: "text-orange-500" },
  { titleKey: "nav.sdkDownloads", url: "/downloads", icon: Download, color: "text-teal-500" },
  { titleKey: "nav.webhooks", url: "/webhooks", icon: Webhook, color: "text-rose-500" },
];

const adminItems = [
  { titleKey: "nav.overview", url: "/admin/overview", icon: PieChart, color: "text-rose-500" },
  { titleKey: "nav.allUsers", url: "/admin/users", icon: Users, color: "text-indigo-500" },
  { titleKey: "nav.allLicenses", url: "/admin/licenses", icon: Key, color: "text-pink-500" },
  { titleKey: "nav.auditLogs", url: "/admin/audit-logs", icon: ScrollText, color: "text-slate-500" },
  { titleKey: "nav.settings", url: "/admin/settings", icon: Settings, color: "text-gray-500" },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { t } = useI18n();

  const isAdmin = user?.role === "admin";

  const initials = user
    ? `${(user.firstName || "")[0] || ""}${(user.lastName || "")[0] || ""}`.toUpperCase() || "U"
    : "U";

  return (
    <Sidebar>
      <SidebarHeader className="p-5">
        <div className="flex items-center gap-3 rounded-md bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 p-2 -m-2">
          <img src={ctrxlLogo} alt="CTRXL" className="h-10 w-10 rounded-md object-cover" />
          <div>
            <span className="font-bold text-sm tracking-tight" data-testid="text-sidebar-brand">
              CTRXL LICENSE
            </span>
            <p className="text-[11px] text-muted-foreground/70 leading-tight">{t("nav.licenseManager")}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground/50 px-4 mb-1">
            {t("nav.mainMenu")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 px-2">
              {mainItems.map((item) => {
                const isActive = location === item.url || location.startsWith(item.url + "/");
                const title = t(item.titleKey);
                return (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={isActive ? "bg-primary/10 rounded-md" : "rounded-md"}
                    >
                      <Link href={item.url} data-testid={`link-${item.titleKey.split(".")[1]}`}>
                        <item.icon className={`h-4 w-4 transition-colors duration-150 ${isActive ? "text-primary" : item.color}`} />
                        <span className="font-medium">{title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin && (
          <>
            <div className="py-2 px-4">
              <SidebarSeparator />
            </div>
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground/50 px-4 mb-1">
                <span className="flex items-center gap-1.5">
                  {t("nav.admin")}
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 leading-tight">PRO</Badge>
                </span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5 px-2">
                  {adminItems.map((item) => {
                    const isActive = location === item.url || location.startsWith(item.url + "/");
                    const title = t(item.titleKey);
                    return (
                      <SidebarMenuItem key={item.titleKey}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={isActive ? "bg-primary/10 rounded-md" : "rounded-md"}
                        >
                          <Link href={item.url} data-testid={`link-admin-${item.titleKey.split(".")[1]}`}>
                            <item.icon className={`h-4 w-4 transition-colors duration-150 ${isActive ? "text-primary" : item.color}`} />
                            <span className="font-medium">{title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarSeparator className="mb-4" />
        <a href="https://t.me/lutaubos" target="_blank" rel="noopener noreferrer" className="block mb-4">
          <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-primary/15 via-purple-500/10 to-pink-500/10 p-3.5 border border-primary/10">
            <div className="absolute -top-3 -right-3 h-12 w-12 rounded-full bg-primary/10 blur-xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold">{t("nav.upgradePro")}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">{t("nav.unlockUnlimited")}</p>
              <Button size="sm" className="w-full" data-testid="button-sidebar-upgrade">
                <Send className="h-3.5 w-3.5 mr-1.5" />
                {t("nav.contactTelegram")}
              </Button>
            </div>
          </div>
        </a>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-primary/15">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium truncate" data-testid="text-user-name">
                {user?.firstName} {user?.lastName}
              </p>
              {isAdmin && <Badge variant="default" className="text-[9px] px-1.5 py-0">Admin</Badge>}
            </div>
            <p className="text-[11px] text-muted-foreground/70 truncate" data-testid="text-user-email">
              {user?.email}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            data-testid="button-logout"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
