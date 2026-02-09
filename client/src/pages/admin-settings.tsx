import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Globe, Shield, Key } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    if (user && user.role !== "admin") setLocation("/dashboard");
  }, [user, setLocation]);

  if (!user || user.role !== "admin") return null;

  return (
    <div className="p-6 space-y-6 max-w-[800px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-admin-settings-title">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your license management platform
        </p>
      </div>

      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">API Base URL</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Use this URL as the base for all API calls
            </p>
            <code className="mt-2 block text-sm font-mono bg-background px-3 py-2 rounded break-all">
              {baseUrl}
            </code>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Authentication</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Dual authentication: Replit Auth (OpenID Connect) and email/password
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Replit Auth</Badge>
              <Badge variant="secondary">Email/Password</Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Key className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">License Key Format</h3>
            <p className="text-sm text-muted-foreground mt-1">
              License keys are generated in the format: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">CL-XXX-XXX-XXX-XXX</code>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              4 segments of 3 uppercase alphanumeric characters
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Platform</h3>
            <p className="text-sm text-muted-foreground mt-1">
              CTRXL LICENSE v1.0
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
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
