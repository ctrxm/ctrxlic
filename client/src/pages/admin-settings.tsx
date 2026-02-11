import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Settings,
  Globe,
  Shield,
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  Save,
  Users,
  Lock,
  Monitor,
  CheckCircle2,
  Send,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import type { Plan } from "@shared/schema";

interface PlanFormData {
  name: string;
  displayName: string;
  priceMonthly: number;
  maxProducts: number;
  maxLicenses: number;
  maxApiKeys: number;
  maxActivationsPerLicense: number;
  features: string;
  isDefault: boolean;
  isActive: boolean;
}

const defaultPlanForm: PlanFormData = {
  name: "",
  displayName: "",
  priceMonthly: 0,
  maxProducts: 3,
  maxLicenses: 10,
  maxApiKeys: 2,
  maxActivationsPerLicense: 1,
  features: "",
  isDefault: false,
  isActive: true,
};

const DEFAULT_SETTINGS: Record<string, string> = {
  "platform.name": "CTRXL LICENSE",
  "platform.defaultRateLimit": "60",
  "platform.defaultMaxActivations": "1",
  "platform.licenseFormat": "CL-XXX-XXX-XXX-XXX",
  "security.sessionTimeoutMinutes": "1440",
  "security.passwordMinLength": "6",
  "security.requireSpecialChar": "false",
  "security.twoFactorEnabled": "false",
  "general.maintenanceMode": "false",
  "general.registrationEnabled": "true",
  "general.defaultUserRole": "user",
  "general.allowReplitAuth": "true",
  "telegram.botToken": "",
  "telegram.chatId": "",
  "telegram.enabled": "false",
};

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormData>(defaultPlanForm);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== "admin") setLocation("/dashboard");
  }, [user, setLocation]);

  const { data: plansData, isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ["/api/admin/plans"],
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  const { data: usersData } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const settings = { ...DEFAULT_SETTINGS, ...settingsData };

  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  useEffect(() => {
    if (settingsData) {
      setLocalSettings({ ...DEFAULT_SETTINGS, ...settingsData });
    }
  }, [settingsData]);

  const mergedSettings = Object.keys(DEFAULT_SETTINGS).length > 0
    ? { ...DEFAULT_SETTINGS, ...(Object.keys(localSettings).length > 0 ? localSettings : settingsData || {}) }
    : settings;

  const createPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/plans", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      setPlanDialogOpen(false);
      toast({ title: "Plan created successfully" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/plans/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      setPlanDialogOpen(false);
      setEditingPlan(null);
      toast({ title: "Plan updated successfully" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      setDeletingPlanId(null);
      toast({ title: "Plan deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      await apiRequest("PUT", "/api/admin/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Settings saved successfully" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const assignPlanMutation = useMutation({
    mutationFn: async ({ userId, planId }: { userId: string; planId: string | null }) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/plan`, { planId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User plan updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openCreatePlan = () => {
    setEditingPlan(null);
    setPlanForm(defaultPlanForm);
    setPlanDialogOpen(true);
  };

  const openEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      displayName: plan.displayName,
      priceMonthly: plan.priceMonthly ?? 0,
      maxProducts: plan.maxProducts ?? 3,
      maxLicenses: plan.maxLicenses ?? 10,
      maxApiKeys: plan.maxApiKeys ?? 2,
      maxActivationsPerLicense: plan.maxActivationsPerLicense ?? 1,
      features: (plan.features || []).join(", "),
      isDefault: plan.isDefault ?? false,
      isActive: plan.isActive ?? true,
    });
    setPlanDialogOpen(true);
  };

  const handleSavePlan = () => {
    const payload = {
      ...planForm,
      features: planForm.features.split(",").map(f => f.trim()).filter(Boolean),
    };
    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data: payload });
    } else {
      createPlanMutation.mutate(payload);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const savePlatformSettings = () => {
    const platformKeys = ["platform.name", "platform.defaultRateLimit", "platform.defaultMaxActivations", "platform.licenseFormat"];
    const data: Record<string, string> = {};
    platformKeys.forEach(k => { data[k] = mergedSettings[k]; });
    saveSettingsMutation.mutate(data);
  };

  const saveSecuritySettings = () => {
    const securityKeys = ["security.sessionTimeoutMinutes", "security.passwordMinLength", "security.requireSpecialChar", "security.twoFactorEnabled"];
    const data: Record<string, string> = {};
    securityKeys.forEach(k => { data[k] = mergedSettings[k]; });
    saveSettingsMutation.mutate(data);
  };

  const saveGeneralSettings = () => {
    const generalKeys = ["general.maintenanceMode", "general.registrationEnabled", "general.defaultUserRole", "general.allowReplitAuth"];
    const data: Record<string, string> = {};
    generalKeys.forEach(k => { data[k] = mergedSettings[k]; });
    saveSettingsMutation.mutate(data);
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[900px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-admin-settings-title">Platform Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage plans, platform configuration, security, and general settings
        </p>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList className="w-full justify-start flex-wrap gap-1">
          <TabsTrigger value="plans" data-testid="tab-plans" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="platform" data-testid="tab-platform" className="gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            Platform
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Security
          </TabsTrigger>
          <TabsTrigger value="general" data-testid="tab-general" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-user-plans" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            User Plans
          </TabsTrigger>
          <TabsTrigger value="telegram" data-testid="tab-telegram" className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Telegram
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold">Subscription Plans</h2>
              <p className="text-sm text-muted-foreground">Create and manage subscription plans with usage limits</p>
            </div>
            <Button onClick={openCreatePlan} data-testid="button-create-plan">
              <Plus className="h-4 w-4 mr-1.5" />
              New Plan
            </Button>
          </div>

          {plansLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : !plansData?.length ? (
            <Card className="p-8 text-center">
              <CreditCard className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No plans created yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first plan to start assigning limits to users</p>
              <Button className="mt-4" onClick={openCreatePlan} data-testid="button-create-first-plan">
                <Plus className="h-4 w-4 mr-1.5" />
                Create Plan
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {plansData.map(plan => (
                <Card key={plan.id} className="p-4 space-y-3" data-testid={`card-plan-${plan.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{plan.displayName}</h3>
                        {plan.isDefault && <Badge variant="secondary">Default</Badge>}
                        {!plan.isActive && <Badge variant="outline">Inactive</Badge>}
                      </div>
                      <p className="text-2xl font-bold mt-1">
                        ${plan.priceMonthly ?? 0}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEditPlan(plan)} data-testid={`button-edit-plan-${plan.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeletingPlanId(plan.id)} data-testid={`button-delete-plan-${plan.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between gap-2">
                      <span>Products</span>
                      <span className="font-medium text-foreground">{plan.maxProducts}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Licenses</span>
                      <span className="font-medium text-foreground">{plan.maxLicenses}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>API Keys</span>
                      <span className="font-medium text-foreground">{plan.maxApiKeys}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Activations/License</span>
                      <span className="font-medium text-foreground">{plan.maxActivationsPerLicense}</span>
                    </div>
                  </div>
                  {plan.features && plan.features.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {plan.features.map((f, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="platform" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Platform Configuration</h2>
            <p className="text-sm text-muted-foreground">Configure your platform name, defaults, and API settings</p>
          </div>
          {settingsLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <Card className="p-5 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="platform-name">Platform Name</Label>
                <Input
                  id="platform-name"
                  data-testid="input-platform-name"
                  value={mergedSettings["platform.name"]}
                  onChange={e => updateSetting("platform.name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license-format">License Key Format</Label>
                <Input
                  id="license-format"
                  data-testid="input-license-format"
                  value={mergedSettings["platform.licenseFormat"]}
                  onChange={e => updateSetting("platform.licenseFormat", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Format template for generated license keys</p>
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="default-rate-limit">Default Rate Limit (req/min)</Label>
                  <Input
                    id="default-rate-limit"
                    type="number"
                    data-testid="input-default-rate-limit"
                    value={mergedSettings["platform.defaultRateLimit"]}
                    onChange={e => updateSetting("platform.defaultRateLimit", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-max-activations">Default Max Activations</Label>
                  <Input
                    id="default-max-activations"
                    type="number"
                    data-testid="input-default-max-activations"
                    value={mergedSettings["platform.defaultMaxActivations"]}
                    onChange={e => updateSetting("platform.defaultMaxActivations", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 flex-wrap pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">API Base URL:</span>
                  <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{typeof window !== "undefined" ? window.location.origin : ""}</code>
                </div>
                <Button onClick={savePlatformSettings} disabled={saveSettingsMutation.isPending || settingsLoading} data-testid="button-save-platform">
                  <Save className="h-4 w-4 mr-1.5" />
                  Save
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Security Settings</h2>
            <p className="text-sm text-muted-foreground">Configure authentication and security policies</p>
          </div>
          {settingsLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <Card className="p-5 space-y-5">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    data-testid="input-session-timeout"
                    value={mergedSettings["security.sessionTimeoutMinutes"]}
                    onChange={e => updateSetting("security.sessionTimeoutMinutes", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-min-length">Minimum Password Length</Label>
                  <Input
                    id="password-min-length"
                    type="number"
                    data-testid="input-password-min-length"
                    value={mergedSettings["security.passwordMinLength"]}
                    onChange={e => updateSetting("security.passwordMinLength", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label>Require Special Characters</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Passwords must contain at least one special character</p>
                  </div>
                  <Switch
                    data-testid="switch-require-special"
                    checked={mergedSettings["security.requireSpecialChar"] === "true"}
                    onCheckedChange={v => updateSetting("security.requireSpecialChar", String(v))}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Enable 2FA for additional account security</p>
                  </div>
                  <Switch
                    data-testid="switch-two-factor"
                    checked={mergedSettings["security.twoFactorEnabled"] === "true"}
                    onCheckedChange={v => updateSetting("security.twoFactorEnabled", String(v))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <div className="flex-1 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Auth methods:</span>
                  <Badge variant="secondary">Replit Auth</Badge>
                  <Badge variant="secondary">Email/Password</Badge>
                </div>
                <Button onClick={saveSecuritySettings} disabled={saveSettingsMutation.isPending || settingsLoading} data-testid="button-save-security">
                  <Save className="h-4 w-4 mr-1.5" />
                  Save
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">General Settings</h2>
            <p className="text-sm text-muted-foreground">Control registration, maintenance mode, and defaults</p>
          </div>
          {settingsLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <Card className="p-5 space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label>Maintenance Mode</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">When enabled, the platform shows a maintenance page to non-admin users</p>
                  </div>
                  <Switch
                    data-testid="switch-maintenance-mode"
                    checked={mergedSettings["general.maintenanceMode"] === "true"}
                    onCheckedChange={v => updateSetting("general.maintenanceMode", String(v))}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label>Allow Registration</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Allow new users to create accounts</p>
                  </div>
                  <Switch
                    data-testid="switch-registration"
                    checked={mergedSettings["general.registrationEnabled"] === "true"}
                    onCheckedChange={v => updateSetting("general.registrationEnabled", String(v))}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label>Allow Replit Auth</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Allow users to sign in with Replit Auth</p>
                  </div>
                  <Switch
                    data-testid="switch-replit-auth"
                    checked={mergedSettings["general.allowReplitAuth"] === "true"}
                    onCheckedChange={v => updateSetting("general.allowReplitAuth", String(v))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-role">Default User Role</Label>
                <Select
                  value={mergedSettings["general.defaultUserRole"]}
                  onValueChange={v => updateSetting("general.defaultUserRole", v)}
                >
                  <SelectTrigger id="default-role" data-testid="select-default-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Role assigned to newly registered users</p>
              </div>
              <div className="flex justify-end pt-2 border-t">
                <Button onClick={saveGeneralSettings} disabled={saveSettingsMutation.isPending || settingsLoading} data-testid="button-save-general">
                  <Save className="h-4 w-4 mr-1.5" />
                  Save
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">User Plan Assignment</h2>
            <p className="text-sm text-muted-foreground">Assign subscription plans to users to control their usage limits</p>
          </div>
          {!usersData || !plansData ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : !usersData.length ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No users found</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {usersData.map((u: any) => (
                <Card key={u.id} className="p-4" data-testid={`card-user-plan-${u.id}`}>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {(u.firstName?.[0] || u.email?.[0] || "U").toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : u.email || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{u.email || "No email"}</p>
                      </div>
                      {u.role === "admin" && <Badge variant="secondary">Admin</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={u.planId || "none"}
                        onValueChange={v => assignPlanMutation.mutate({ userId: u.id, planId: v === "none" ? null : v })}
                      >
                        <SelectTrigger className="w-[160px]" data-testid={`select-user-plan-${u.id}`}>
                          <SelectValue placeholder="No plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Plan</SelectItem>
                          {plansData.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.displayName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {u.planId && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="telegram" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Telegram Notifications</h2>
            <p className="text-sm text-muted-foreground">Configure real-time license event notifications via Telegram bot</p>
          </div>
          <Card className="p-5 space-y-4">
            <div className="space-y-3">
              <div>
                <Label>Telegram Bot Token</Label>
                <Input
                  data-testid="input-telegram-bot-token"
                  type="password"
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  value={mergedSettings["telegram.botToken"] || ""}
                  onChange={e => updateSetting("telegram.botToken", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Get a bot token from @BotFather on Telegram</p>
              </div>
              <div>
                <Label>Chat ID</Label>
                <Input
                  data-testid="input-telegram-chat-id"
                  placeholder="-1001234567890"
                  value={mergedSettings["telegram.chatId"] || ""}
                  onChange={e => updateSetting("telegram.chatId", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Your Telegram user ID or group chat ID</p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label>Enable Notifications</Label>
                  <p className="text-xs text-muted-foreground">Send notifications for license events</p>
                </div>
                <Switch
                  data-testid="switch-telegram-enabled"
                  checked={mergedSettings["telegram.enabled"] === "true"}
                  onCheckedChange={v => updateSetting("telegram.enabled", v ? "true" : "false")}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <Button
                onClick={() => {
                  const telegramKeys = ["telegram.botToken", "telegram.chatId", "telegram.enabled"];
                  const data: Record<string, string> = {};
                  telegramKeys.forEach(k => { data[k] = mergedSettings[k] || ""; });
                  saveSettingsMutation.mutate(data);
                }}
                disabled={saveSettingsMutation.isPending}
                data-testid="button-save-telegram"
              >
                <Save className="h-4 w-4 mr-1.5" />
                Save Settings
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const res = await apiRequest("POST", "/api/admin/telegram/test");
                    const result = await res.json();
                    if (result.success) {
                      toast({ title: "Test message sent successfully" });
                    } else {
                      toast({ title: "Failed", description: result.error || "Could not send test message", variant: "destructive" });
                    }
                  } catch (e: any) {
                    toast({ title: "Error", description: e.message, variant: "destructive" });
                  }
                }}
                data-testid="button-test-telegram"
              >
                <Send className="h-4 w-4 mr-1.5" />
                Send Test Message
              </Button>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Notification Events</h3>
            <p className="text-sm text-muted-foreground mb-3">When enabled, you will receive Telegram notifications for:</p>
            <div className="space-y-2">
              {[
                { event: "License Created", desc: "When a new license is generated" },
                { event: "License Activated", desc: "When a license is activated on a machine" },
                { event: "License Expired", desc: "When a license expires" },
                { event: "License Renewed", desc: "When a license is renewed" },
              ].map((item) => (
                <div key={item.event} className="flex items-start gap-3 p-2.5 rounded-md bg-background">
                  <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{item.event}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Create Plan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Slug Name</Label>
                <Input
                  id="plan-name"
                  data-testid="input-plan-name"
                  placeholder="e.g. free"
                  value={planForm.name}
                  onChange={e => setPlanForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-display">Display Name</Label>
                <Input
                  id="plan-display"
                  data-testid="input-plan-display"
                  placeholder="e.g. Free Plan"
                  value={planForm.displayName}
                  onChange={e => setPlanForm(p => ({ ...p, displayName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-price">Price ($/month)</Label>
              <Input
                id="plan-price"
                type="number"
                data-testid="input-plan-price"
                value={planForm.priceMonthly}
                onChange={e => setPlanForm(p => ({ ...p, priceMonthly: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plan-max-products">Max Products</Label>
                <Input
                  id="plan-max-products"
                  type="number"
                  data-testid="input-plan-max-products"
                  value={planForm.maxProducts}
                  onChange={e => setPlanForm(p => ({ ...p, maxProducts: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-max-licenses">Max Licenses</Label>
                <Input
                  id="plan-max-licenses"
                  type="number"
                  data-testid="input-plan-max-licenses"
                  value={planForm.maxLicenses}
                  onChange={e => setPlanForm(p => ({ ...p, maxLicenses: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plan-max-keys">Max API Keys</Label>
                <Input
                  id="plan-max-keys"
                  type="number"
                  data-testid="input-plan-max-keys"
                  value={planForm.maxApiKeys}
                  onChange={e => setPlanForm(p => ({ ...p, maxApiKeys: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-max-activations">Activations/License</Label>
                <Input
                  id="plan-max-activations"
                  type="number"
                  data-testid="input-plan-max-activations"
                  value={planForm.maxActivationsPerLicense}
                  onChange={e => setPlanForm(p => ({ ...p, maxActivationsPerLicense: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-features">Features (comma separated)</Label>
              <Input
                id="plan-features"
                data-testid="input-plan-features"
                placeholder="e.g. Domain Binding, Priority Support"
                value={planForm.features}
                onChange={e => setPlanForm(p => ({ ...p, features: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  data-testid="switch-plan-default"
                  checked={planForm.isDefault}
                  onCheckedChange={v => setPlanForm(p => ({ ...p, isDefault: v }))}
                />
                <Label>Default Plan</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  data-testid="switch-plan-active"
                  checked={planForm.isActive}
                  onCheckedChange={v => setPlanForm(p => ({ ...p, isActive: v }))}
                />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)} data-testid="button-cancel-plan">Cancel</Button>
            <Button
              onClick={handleSavePlan}
              disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
              data-testid="button-save-plan"
            >
              {editingPlan ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingPlanId} onOpenChange={() => setDeletingPlanId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this plan? Users assigned to this plan will be unassigned.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingPlanId(null)} data-testid="button-cancel-delete-plan">Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deletingPlanId && deletePlanMutation.mutate(deletingPlanId)}
              disabled={deletePlanMutation.isPending}
              data-testid="button-confirm-delete-plan"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Monitor className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Platform Info</h3>
            <p className="text-sm text-muted-foreground mt-1">
              CTRXL LICENSE v1.0
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">PostgreSQL</Badge>
              <Badge variant="secondary">Express</Badge>
              <Badge variant="secondary">React</Badge>
              <Badge variant="secondary">Drizzle ORM</Badge>
              <Badge variant="secondary">TypeScript</Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
