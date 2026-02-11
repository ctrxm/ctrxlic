import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Key,
  CheckCircle2,
  XCircle,
  Copy,
  Globe,
  Code2,
  FileCode,
  Terminal,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Settings,
  Zap,
  HelpCircle,
  Loader2,
  Search,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ctrxlLogo from "@/assets/images/ctrxl-logo.png";

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Code copied" });
  };

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 z-10 invisible group-hover:visible">
        <Button size="icon" variant="ghost" onClick={copy}>
          {copied ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <div className="bg-background rounded-md p-4 font-mono text-sm overflow-x-auto">
        <pre className="text-muted-foreground whitespace-pre-wrap">{code}</pre>
      </div>
    </div>
  );
}

function NavBar() {
  return (
    <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src={ctrxlLogo} alt="CTRXL" className="h-7 w-7 rounded-md object-cover" />
          <span className="font-semibold text-base tracking-tight">CTRXL LICENSE</span>
        </div>
        <ThemeToggle />
      </div>
    </nav>
  );
}

function LicenseSubmitForm({ onSubmit }: { onSubmit: (key: string) => void }) {
  const [inputKey, setInputKey] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputKey.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter your license key");
      return;
    }
    if (!/^CL-[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(trimmed)) {
      setError("Invalid format. License key should look like: CL-XXX-XXX-XXX-XXX");
      return;
    }
    setError("");
    onSubmit(trimmed);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="max-w-lg mx-auto p-4 sm:p-6 mt-8 sm:mt-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
            <Key className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-activate-title">
            Activate Your License
          </h1>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            Enter the license key you received with your purchase to activate this application
          </p>
        </div>

        <Card className="p-5 sm:p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="license-key" className="text-sm font-medium">License Key</Label>
              <Input
                id="license-key"
                type="text"
                placeholder="CL-XXX-XXX-XXX-XXX"
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  if (error) setError("");
                }}
                className="font-mono text-center text-base tracking-wider"
                autoFocus
                autoComplete="off"
                data-testid="input-license-key"
              />
              {error && (
                <p className="text-sm text-destructive flex items-center gap-1.5" data-testid="text-license-error">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  {error}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" data-testid="button-submit-license">
              <Search className="h-4 w-4 mr-1.5" />
              Verify License
            </Button>
          </form>

          <div className="border-t pt-4 space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              Your license key was provided when you purchased this software.
              It starts with <code className="bg-muted px-1 py-0.5 rounded font-mono">CL-</code> followed by 4 groups of 3 characters.
            </p>
            <div className="flex items-start gap-2 bg-muted/50 rounded-md p-3">
              <HelpCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Don't have a license key?</p>
                <p>Contact the seller of this software to obtain your license key. You should have received it via email after your purchase.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function LicenseActivationWizard({ licenseKey, onBack }: { licenseKey: string; onBack: () => void }) {
  const { toast } = useToast();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);
  const [activationError, setActivationError] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [domainInput, setDomainInput] = useState(
    typeof window !== "undefined" ? window.location.hostname : ""
  );

  const { data: licenseInfo, isLoading, error } = useQuery<any>({
    queryKey: ["/api/v1/licenses/info", licenseKey],
    queryFn: async () => {
      const res = await fetch(`/api/v1/licenses/info/${encodeURIComponent(licenseKey)}`);
      if (!res.ok) throw new Error("License not found");
      return res.json();
    },
    retry: false,
  });

  const copyKey = () => {
    navigator.clipboard.writeText(licenseKey);
    toast({ title: "License key copied" });
  };

  const handleActivate = async () => {
    if (!apiKeyInput.trim()) {
      setActivationError("Please enter your API key");
      return;
    }
    if (!apiKeyInput.trim().startsWith("cl_")) {
      setActivationError("API key should start with cl_");
      return;
    }

    setActivating(true);
    setActivationError("");

    try {
      const res = await fetch(`/api/v1/licenses/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKeyInput.trim(),
        },
        body: JSON.stringify({
          license_key: licenseKey,
          domain: domainInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setActivated(true);
        toast({ title: "License validated successfully!" });
      } else {
        setActivationError(data.error || "License validation failed. Please check your API key and try again.");
      }
    } catch {
      setActivationError("Connection failed. Please check your internet connection and try again.");
    } finally {
      setActivating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !licenseInfo) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="max-w-lg mx-auto p-4 sm:p-6 mt-8">
          <Card className="p-8 sm:p-12 text-center">
            <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">License Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The license key <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-sm">{licenseKey}</code> is invalid or does not exist.
            </p>
            <Button onClick={onBack} variant="outline" data-testid="button-try-again">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Try Another Key
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const isActive = licenseInfo.status === "active";
  const isExpired = licenseInfo.expiresAt && new Date(licenseInfo.expiresAt) < new Date();

  const envFileContent = `# CTRXL License Configuration
CTRXL_API_KEY=${apiKeyInput.trim() || "your_api_key_here"}
CTRXL_LICENSE_KEY=${licenseKey}`;

  const phpConfigCode = `<?php
// config.php - Add this to your application
require_once __DIR__ . '/LicenseGuard.php';

$license = new LicenseGuard(
    '${apiKeyInput.trim() || "your_api_key_here"}',
    '${licenseKey}'
);

// Auto-validate: redirects here if license is invalid
$license->validateOrRedirect();

// If we reach here, your license is valid!`;

  const nextjsConfigCode = `// .env.local
CTRXL_API_KEY=${apiKeyInput.trim() || "your_api_key_here"}
CTRXL_LICENSE_KEY=${licenseKey}

// The middleware.ts file will automatically
// validate your license on every request.`;

  const pythonConfigCode = `# .env
CTRXL_API_KEY=${apiKeyInput.trim() || "your_api_key_here"}
CTRXL_LICENSE_KEY=${licenseKey}

# The app.py file will automatically
# validate your license on every request.`;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={onBack} data-testid="button-back-form">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-install-title">
              License Activation
            </h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Complete the steps below to activate your license
            </p>
          </div>
        </div>

        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-semibold text-lg">License Information</h2>
            {isActive && !isExpired ? (
              <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : isExpired ? (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Expired
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                {licenseInfo.status}
              </Badge>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">License Key</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded" data-testid="text-install-license-key">
                  {licenseKey}
                </code>
                <Button size="icon" variant="ghost" onClick={copyKey} data-testid="button-copy-install-key">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Product</p>
              <p className="text-sm font-medium" data-testid="text-install-product">{licenseInfo.productName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Type</p>
              <Badge variant="secondary" className="capitalize" data-testid="text-install-type">{licenseInfo.type}</Badge>
            </div>
            {licenseInfo.customerName && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Licensed To</p>
                <p className="text-sm" data-testid="text-install-customer">{licenseInfo.customerName}</p>
              </div>
            )}
            {licenseInfo.expiresAt && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Expires</p>
                <p className="text-sm" data-testid="text-install-expires">
                  {new Date(licenseInfo.expiresAt).toLocaleDateString()}
                </p>
              </div>
            )}
            {licenseInfo.allowedDomains && licenseInfo.allowedDomains.length > 0 && (
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Allowed Domains</p>
                <div className="flex flex-wrap gap-1.5">
                  {licenseInfo.allowedDomains.map((d: string) => (
                    <Badge key={d} variant="secondary" className="font-mono text-xs" data-testid={`badge-domain-${d}`}>
                      <Globe className="h-3 w-3 mr-1" />
                      {d}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          {licenseInfo.allowedDomains && licenseInfo.allowedDomains.length > 0 && (
            <div className="flex items-start gap-2 bg-muted/50 rounded-md p-3">
              <AlertCircle className="h-4 w-4 text-chart-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                This license is bound to specific domains. It will only validate on: {licenseInfo.allowedDomains.join(", ")}
              </p>
            </div>
          )}
        </Card>

        {!activated ? (
          <Card className="p-5 space-y-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">Activate License</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter your API key to validate and activate this license. The API key was provided by the seller along with your purchase.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key" className="text-sm font-medium">API Key</Label>
                <Input
                  id="api-key"
                  type="text"
                  placeholder="cl_xxxxxxxxxxxxxxxx"
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    if (activationError) setActivationError("");
                  }}
                  className="font-mono"
                  data-testid="input-api-key"
                />
                <p className="text-xs text-muted-foreground">
                  The API key starts with <code className="bg-muted px-1 py-0.5 rounded font-mono">cl_</code>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain" className="text-sm font-medium">
                  Domain <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="domain"
                  type="text"
                  placeholder="yourdomain.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  data-testid="input-domain"
                />
                <p className="text-xs text-muted-foreground">
                  The domain where this application is running. Auto-detected from current URL.
                </p>
              </div>

              {activationError && (
                <div className="flex items-start gap-2 bg-destructive/10 rounded-md p-3">
                  <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive" data-testid="text-activation-error">{activationError}</p>
                </div>
              )}

              <Button
                onClick={handleActivate}
                disabled={activating}
                className="w-full"
                data-testid="button-activate-license"
              >
                {activating ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4 mr-1.5" />
                )}
                {activating ? "Validating..." : "Validate & Activate"}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-5 space-y-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-chart-2" />
              <h2 className="font-semibold text-lg text-chart-2">License Activated Successfully</h2>
            </div>
            <div className="flex items-start gap-2 bg-chart-2/10 rounded-md p-4">
              <CheckCircle2 className="h-5 w-5 text-chart-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Your license has been validated!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Now configure your application with the credentials below. Once configured, restart your application and it will run normally without redirecting back here.
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Setup Instructions</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-medium text-sm">Find the Configuration File</p>
                <p className="text-sm text-muted-foreground">
                  Look for one of these files in your project root:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">.env</Badge>
                  <Badge variant="secondary" className="font-mono text-xs">.env.local</Badge>
                  <Badge variant="secondary" className="font-mono text-xs">config.php</Badge>
                  <Badge variant="secondary" className="font-mono text-xs">.env.example</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  If you see <code className="bg-muted px-1 py-0.5 rounded font-mono">.env.example</code>, copy it to <code className="bg-muted px-1 py-0.5 rounded font-mono">.env</code> first.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-medium text-sm">Enter Your Credentials</p>
                <p className="text-sm text-muted-foreground">
                  Copy the configuration below into your config file. Your license key {activated ? "and API key are" : "is"} already pre-filled.
                </p>
                <div className="flex items-center gap-2 bg-muted/50 rounded-md p-3">
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground">License Key</p>
                    <code className="text-sm font-mono font-medium">{licenseKey}</code>
                  </div>
                  <Button size="icon" variant="ghost" onClick={copyKey}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-bold text-primary">3</span>
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-medium text-sm">Restart Your Application</p>
                <p className="text-sm text-muted-foreground">
                  After saving the configuration, restart your application. It will validate the license automatically and run normally.
                </p>
                {licenseInfo.allowedDomains && licenseInfo.allowedDomains.length > 0 && (
                  <div className="flex items-start gap-2 bg-muted/50 rounded-md p-3">
                    <AlertCircle className="h-4 w-4 text-chart-4 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Make sure your app runs on an allowed domain: {licenseInfo.allowedDomains.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Configuration Examples</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Choose your project type below. Your license key {activated ? "and API key are" : "is"} already pre-filled.
          </p>
          <Tabs defaultValue="env">
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="env" data-testid="tab-install-env">
                <Terminal className="h-3.5 w-3.5 mr-1.5" />
                .env File
              </TabsTrigger>
              <TabsTrigger value="php" data-testid="tab-install-php">
                <FileCode className="h-3.5 w-3.5 mr-1.5" />
                PHP
              </TabsTrigger>
              <TabsTrigger value="nextjs" data-testid="tab-install-nextjs">
                <Globe className="h-3.5 w-3.5 mr-1.5" />
                Next.js / Node.js
              </TabsTrigger>
              <TabsTrigger value="python" data-testid="tab-install-python">
                <Code2 className="h-3.5 w-3.5 mr-1.5" />
                Python
              </TabsTrigger>
            </TabsList>
            <TabsContent value="env">
              <CodeBlock code={envFileContent} />
            </TabsContent>
            <TabsContent value="php">
              <CodeBlock code={phpConfigCode} />
            </TabsContent>
            <TabsContent value="nextjs">
              <CodeBlock code={nextjsConfigCode} />
            </TabsContent>
            <TabsContent value="python">
              <CodeBlock code={pythonConfigCode} />
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Troubleshooting</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="font-medium text-sm">I keep getting redirected back to this page</p>
              <p className="text-sm text-muted-foreground">
                This means your license is not validating correctly. Check that:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside ml-2 space-y-0.5">
                <li>Your API key is correct (starts with <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">cl_</code>)</li>
                <li>Your license key matches exactly: <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{licenseKey}</code></li>
                <li>The <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">.env</code> file is in the project root</li>
                {licenseInfo.allowedDomains && licenseInfo.allowedDomains.length > 0 && (
                  <li>Your app runs on an allowed domain: {licenseInfo.allowedDomains.join(", ")}</li>
                )}
              </ul>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">Where do I get the API key?</p>
              <p className="text-sm text-muted-foreground">
                The API key should be provided by the seller. It starts with <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">cl_</code> and looks like: <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">cl_xxxxxxxxxxxxxxxx</code>
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">My license shows as expired or inactive</p>
              <p className="text-sm text-muted-foreground">
                Contact the seller to renew or reactivate your license.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="font-semibold text-lg">API Endpoints</h2>
          <p className="text-sm text-muted-foreground">
            For advanced integration, use these endpoints directly:
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Badge className="font-mono text-xs flex-shrink-0">POST</Badge>
              <div>
                <code className="text-sm font-mono">{baseUrl}/api/v1/licenses/validate</code>
                <p className="text-xs text-muted-foreground mt-0.5">Validate your license (requires API key header)</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="font-mono text-xs flex-shrink-0">GET</Badge>
              <div>
                <code className="text-sm font-mono">{baseUrl}/api/v1/licenses/info/{licenseKey}</code>
                <p className="text-xs text-muted-foreground mt-0.5">View license info (public)</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="font-mono text-xs flex-shrink-0">POST</Badge>
              <div>
                <code className="text-sm font-mono">{baseUrl}/api/v1/licenses/activate</code>
                <p className="text-xs text-muted-foreground mt-0.5">Activate on a machine (requires API key header)</p>
              </div>
            </div>
          </div>
        </Card>

        <footer className="py-8 text-center text-sm text-muted-foreground border-t">
          <p>Powered by CTRXL LICENSE</p>
        </footer>
      </div>
    </div>
  );
}

export default function InstallPage() {
  const [location, setLocation] = useLocation();
  const urlKey = location.startsWith("/install/") ? location.replace("/install/", "").trim() : "";
  const [submittedKey, setSubmittedKey] = useState(urlKey);

  if (!submittedKey) {
    return <LicenseSubmitForm onSubmit={(key) => {
      setSubmittedKey(key);
      setLocation(`/install/${key}`);
    }} />;
  }

  return (
    <LicenseActivationWizard
      licenseKey={submittedKey}
      onBack={() => {
        setSubmittedKey("");
        setLocation("/install");
      }}
    />
  );
}
