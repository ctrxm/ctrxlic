import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

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

export default function InstallPage() {
  const [location] = useLocation();
  const licenseKey = location.replace("/install/", "");
  const { toast } = useToast();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b bg-background/80 backdrop-blur-md">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <Key className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg tracking-tight">CTRXL LICENSE</span>
            </div>
            <ThemeToggle />
          </div>
        </nav>
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
        <nav className="border-b bg-background/80 backdrop-blur-md">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <Key className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg tracking-tight">CTRXL LICENSE</span>
            </div>
            <ThemeToggle />
          </div>
        </nav>
        <div className="max-w-4xl mx-auto p-6">
          <Card className="p-12 text-center">
            <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">License Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The license key provided is invalid or does not exist.
            </p>
            <p className="text-sm text-muted-foreground">
              Please check that you have the correct license key. If you purchased this source code, contact the seller for your license key.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const isActive = licenseInfo.status === "active";
  const isExpired = licenseInfo.expiresAt && new Date(licenseInfo.expiresAt) < new Date();

  const envFileContent = `# CTRXL License Configuration
# Copy this file to .env and fill in the values

CTRXL_API_KEY=your_api_key_here
CTRXL_LICENSE_KEY=${licenseKey}`;

  const phpConfigCode = `<?php
// config.php - Add this to your application
require_once __DIR__ . '/LicenseGuard.php';

$license = new LicenseGuard(
    'your_api_key_here',     // Replace with your API key
    '${licenseKey}'          // Your license key (already set)
);

// Auto-validate: redirects here if license is invalid
$license->validateOrRedirect();

// If we reach here, your license is valid!`;

  const nextjsConfigCode = `// .env.local - Create this file in your project root
CTRXL_API_KEY=your_api_key_here
CTRXL_LICENSE_KEY=${licenseKey}

// The middleware.ts file in your project will
// automatically read these values and validate
// your license on every request.`;

  const pythonConfigCode = `# .env - Create this file in your project root
CTRXL_API_KEY=your_api_key_here
CTRXL_LICENSE_KEY=${licenseKey}

# The app.py file in your project will
# automatically read these values and validate
# your license on every request.`;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <Key className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">CTRXL LICENSE</span>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-install-title">
            License Installation Guide
          </h1>
          <p className="text-muted-foreground mt-1">
            Follow the steps below to activate your license and start using the application
          </p>
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
                This license is bound to specific domains. It will only validate successfully when used on the allowed domains listed above.
              </p>
            </div>
          )}
        </Card>

        <Card className="p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Quick Setup (3 Steps)</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-medium text-sm">Find the Configuration File</p>
                <p className="text-sm text-muted-foreground">
                  Look for one of these files in your project root. This is where you'll enter your license information:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">.env</Badge>
                  <Badge variant="secondary" className="font-mono text-xs">.env.local</Badge>
                  <Badge variant="secondary" className="font-mono text-xs">config.php</Badge>
                  <Badge variant="secondary" className="font-mono text-xs">.env.example</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  If you see a <code className="bg-muted px-1 py-0.5 rounded font-mono">.env.example</code> file, copy it to <code className="bg-muted px-1 py-0.5 rounded font-mono">.env</code> first.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-medium text-sm">Enter Your License Key & API Key</p>
                <p className="text-sm text-muted-foreground">
                  Your license key is already shown above. You also need an API key - the seller should have provided this, or you can request one from them.
                </p>
                <div className="flex items-center gap-2 bg-muted/50 rounded-md p-3">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Your License Key</p>
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
                <p className="font-medium text-sm">Run the Application</p>
                <p className="text-sm text-muted-foreground">
                  Start your application as usual. The license will be validated automatically. If everything is configured correctly, the app will run normally without redirecting back to this page.
                </p>
                {licenseInfo.allowedDomains && licenseInfo.allowedDomains.length > 0 && (
                  <div className="flex items-start gap-2 bg-muted/50 rounded-md p-3">
                    <AlertCircle className="h-4 w-4 text-chart-4 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Make sure your application runs on one of the allowed domains: {licenseInfo.allowedDomains.join(", ")}
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
            Choose your project type below and follow the configuration example. Your license key is already pre-filled.
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
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Copy this into your <code className="bg-muted px-1 py-0.5 rounded font-mono">.env</code> or <code className="bg-muted px-1 py-0.5 rounded font-mono">.env.local</code> file:
                </p>
                <CodeBlock code={envFileContent} />
              </div>
            </TabsContent>
            <TabsContent value="php">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  If your project uses PHP, update the <code className="bg-muted px-1 py-0.5 rounded font-mono">config.php</code> file:
                </p>
                <CodeBlock code={phpConfigCode} />
              </div>
            </TabsContent>
            <TabsContent value="nextjs">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Create or update <code className="bg-muted px-1 py-0.5 rounded font-mono">.env.local</code> in your project root:
                </p>
                <CodeBlock code={nextjsConfigCode} />
              </div>
            </TabsContent>
            <TabsContent value="python">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Create or update <code className="bg-muted px-1 py-0.5 rounded font-mono">.env</code> in your project root:
                </p>
                <CodeBlock code={pythonConfigCode} />
              </div>
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
                <li>Your API key is correct (ask the seller if unsure)</li>
                <li>Your license key matches exactly: <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{licenseKey}</code></li>
                <li>The <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">.env</code> file is in the project root (not inside a subfolder)</li>
                {licenseInfo.allowedDomains && licenseInfo.allowedDomains.length > 0 && (
                  <li>Your app is running on an allowed domain: {licenseInfo.allowedDomains.join(", ")}</li>
                )}
              </ul>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-sm">Where do I get the API key?</p>
              <p className="text-sm text-muted-foreground">
                The API key should be provided by the seller along with your purchase. If you don't have one, contact the seller. 
                The API key starts with <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">cl_</code> and looks like: <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">cl_xxxxxxxxxxxxxxxx</code>
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-sm">My license shows as expired or inactive</p>
              <p className="text-sm text-muted-foreground">
                Contact the seller to renew or reactivate your license. The current status of this license is shown at the top of this page.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-sm">Can I use this license on multiple domains?</p>
              <p className="text-sm text-muted-foreground">
                {licenseInfo.allowedDomains && licenseInfo.allowedDomains.length > 0
                  ? `This license is restricted to: ${licenseInfo.allowedDomains.join(", ")}. Contact the seller to add more domains.`
                  : "This license has no domain restrictions and can be used on any domain. However, check your license type for any activation limits."
                }
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="font-semibold text-lg">API Endpoints</h2>
          <p className="text-sm text-muted-foreground">
            For advanced integration or custom implementations, use these API endpoints directly:
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
                <p className="text-xs text-muted-foreground mt-0.5">View license info (public, no API key needed)</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="font-mono text-xs flex-shrink-0">POST</Badge>
              <div>
                <code className="text-sm font-mono">{baseUrl}/api/v1/licenses/activate</code>
                <p className="text-xs text-muted-foreground mt-0.5">Activate license on a machine (requires API key header)</p>
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
