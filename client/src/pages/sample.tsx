import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import {
  Key,
  CheckCircle2,
  Copy,
  Globe,
  Code2,
  FileCode,
  Terminal,
  AlertCircle,
  ShieldCheck,
  Settings,
  Zap,
  HelpCircle,
  ArrowLeft,
  Eye,
  Lock,
  Server,
  Cpu,
  BarChart3,
  RefreshCw,
  ArrowRight,
  Play,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import ctrxlLogo from "@/assets/images/ctrxl-logo.png";

function CodeBlock({ code, label }: { code: string; label?: string }) {
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
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground font-mono">{label}</span>
        </div>
      )}
      <div className="absolute top-2 right-2 z-10 invisible group-hover:visible">
        <Button size="icon" variant="ghost" onClick={copy} data-testid="button-copy-code">
          {copied ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <div className="bg-zinc-950 dark:bg-zinc-900 rounded-md p-4 font-mono text-sm overflow-x-auto border border-zinc-800">
        <pre className="text-zinc-300 whitespace-pre-wrap">{code}</pre>
      </div>
    </div>
  );
}

const SAMPLE_LICENSE = "CL-X9K-M2P-R7W-Q4N";
const SAMPLE_API_KEY = "cl_sample_k8f2m9x4p7r1w3n6";

const demoTabs = [
  { id: "install" as const, label: "Installation Flow", icon: Key },
  { id: "validate" as const, label: "API Validation", icon: ShieldCheck },
  { id: "sdk" as const, label: "SDK Integration", icon: Code2 },
  { id: "portal" as const, label: "Customer Portal", icon: Globe },
];

export default function SamplePage() {
  const [activeDemo, setActiveDemo] = useState<"install" | "validate" | "sdk" | "portal">("install");
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const sampleValidateRequest = `curl -X POST ${baseUrl}/api/v1/licenses/validate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${SAMPLE_API_KEY}" \\
  -d '{
    "license_key": "${SAMPLE_LICENSE}",
    "product_id": "my-app",
    "domain": "mywebsite.com"
  }'`;

  const sampleValidateResponse = `{
  "valid": true,
  "license": {
    "type": "standard",
    "status": "active",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "expires_at": "2027-01-15T00:00:00Z",
    "activations": 1,
    "max_activations": 5,
    "allowed_domains": ["mywebsite.com"]
  },
  "signature": "hmac_sha256_...",
  "timestamp": 1770000000,
  "nonce": "abc123..."
}`;

  const sampleActivateRequest = `curl -X POST ${baseUrl}/api/v1/licenses/activate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${SAMPLE_API_KEY}" \\
  -d '{
    "license_key": "${SAMPLE_LICENSE}",
    "machine_id": "server-prod-01"
  }'`;

  const sampleNonceRequest = `curl -X POST ${baseUrl}/api/v1/nonce \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${SAMPLE_API_KEY}"`;

  const phpSdkSample = `<?php
require_once __DIR__ . '/LicenseGuard.php';

$license = new LicenseGuard(
    '${SAMPLE_API_KEY}',
    '${SAMPLE_LICENSE}'
);

// Option 1: Auto-redirect if invalid
$license->validateOrRedirect();

// Option 2: Manual check
$result = $license->validate();
if (!$result['valid']) {
    die('License invalid: ' . $result['error']);
}

// Anti-crack: Verify response signature
if (!$license->verifySignature($result)) {
    die('Response tampered!');
}

echo "License valid! Welcome.";`;

  const nextjsSdkSample = `// middleware.ts
import { LicenseGuard } from './lib/license-guard';

const guard = new LicenseGuard({
  apiKey: process.env.CTRXL_API_KEY!,
  licenseKey: process.env.CTRXL_LICENSE_KEY!,
  apiUrl: '${baseUrl}',
});

export async function middleware(req) {
  const result = await guard.validate({
    domain: req.headers.get('host'),
  });

  if (!result.valid) {
    return Response.redirect(
      \`${baseUrl}/install/\${process.env.CTRXL_LICENSE_KEY}\`
    );
  }

  // Verify HMAC signature (anti-tamper)
  if (!guard.verifySignature(result)) {
    return new Response('Tampered response', { status: 403 });
  }
}`;

  const pythonSdkSample = `# license_guard.py
import os, requests, hmac, hashlib

class LicenseGuard:
    def __init__(self):
        self.api_key = os.getenv('CTRXL_API_KEY')
        self.license_key = os.getenv('CTRXL_LICENSE_KEY')
        self.api_url = '${baseUrl}'

    def validate(self, domain=None):
        resp = requests.post(
            f'{self.api_url}/api/v1/licenses/validate',
            headers={'X-API-Key': self.api_key},
            json={
                'license_key': self.license_key,
                'domain': domain,
            }
        )
        return resp.json()

    def verify_signature(self, data, secret):
        payload = f"{data['timestamp']}:{data['nonce']}"
        expected = hmac.new(
            secret.encode(), payload.encode(),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(
            expected, data.get('signature', '')
        )

# Usage in Flask
guard = LicenseGuard()
result = guard.validate(domain='myapp.com')
if not result.get('valid'):
    abort(403, 'Invalid license')`;

  const envSample = `# .env - License Configuration
CTRXL_API_KEY=${SAMPLE_API_KEY}
CTRXL_LICENSE_KEY=${SAMPLE_LICENSE}
CTRXL_API_URL=${baseUrl}`;

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float-orb {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-12px) scale(1.05); }
        }
      `}</style>

      <nav className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="flex items-center gap-2 hover-elevate rounded-md px-2 py-1 cursor-pointer" data-testid="link-home">
                <img src={ctrxlLogo} alt="CTRXL" className="h-7 w-7 rounded-md object-cover" />
                <span className="font-semibold text-base tracking-tight">CTRXL LICENSE</span>
              </div>
            </Link>
            <Badge variant="secondary" className="text-xs">Live Demo</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="link-back-home">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Back
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        <div
          className="absolute top-10 right-20 w-32 h-32 rounded-full bg-primary/10 blur-3xl"
          style={{ animation: "float-orb 6s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-10 left-10 w-24 h-24 rounded-full bg-purple-500/10 blur-3xl"
          style={{ animation: "float-orb 8s ease-in-out infinite 1s" }}
        />

        <div className="relative max-w-6xl mx-auto px-4 pt-10 pb-6 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Interactive Demo
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" data-testid="text-sample-title">
            Live Demo & <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Sample Pages</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-base">
            Explore how CTRXL LICENSE works end-to-end. See the installation flow, API validation, SDK integration, and customer portal in action.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-8 space-y-6">
        <div className="flex flex-wrap gap-2 -mt-1">
          {demoTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeDemo === tab.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveDemo(tab.id)}
              data-testid={`button-demo-${tab.id}`}
            >
              <tab.icon className="h-3.5 w-3.5 mr-1.5" />
              {tab.label}
            </Button>
          ))}
        </div>

        {activeDemo === "install" && (
          <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/5 p-5 border-b">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-md bg-primary/15 flex items-center justify-center">
                    <Eye className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Buyer Installation Page Preview</h2>
                    <p className="text-sm text-muted-foreground">
                      When a buyer purchases your software, they receive a license key and are guided through setup.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-5">
                <div className="rounded-md border p-5 space-y-4 bg-muted/20">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h3 className="font-semibold">License Information</h3>
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">License Key</p>
                      <code className="text-sm font-mono bg-muted px-2.5 py-1 rounded-md inline-block" data-testid="text-sample-key">{SAMPLE_LICENSE}</code>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Product</p>
                      <p className="text-sm font-medium" data-testid="text-sample-product">My Premium App</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Type</p>
                      <Badge variant="secondary" className="capitalize">standard</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Licensed To</p>
                      <p className="text-sm">John Doe (john@example.com)</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Expires</p>
                      <p className="text-sm">January 15, 2027</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Allowed Domains</p>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="font-mono text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          mywebsite.com
                        </Badge>
                        <Badge variant="secondary" className="font-mono text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          staging.mywebsite.com
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-md p-3">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      This license is bound to specific domains. It will only validate successfully when used on the allowed domains listed above.
                    </p>
                  </div>
                </div>

                <div className="rounded-md border p-5 space-y-4 bg-muted/20">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-md bg-primary/15 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold">Quick Setup (3 Steps)</h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      {
                        step: "1",
                        title: "Find the Configuration File",
                        desc: <>Look for <code className="bg-muted px-1 py-0.5 rounded font-mono text-xs">.env</code>, <code className="bg-muted px-1 py-0.5 rounded font-mono text-xs">.env.local</code>, or <code className="bg-muted px-1 py-0.5 rounded font-mono text-xs">config.php</code> in your project root.</>,
                        color: "from-primary to-purple-500",
                      },
                      {
                        step: "2",
                        title: "Enter Your License Key & API Key",
                        desc: "Paste your license key and API key into the configuration file.",
                        color: "from-purple-500 to-indigo-500",
                      },
                      {
                        step: "3",
                        title: "Run the Application",
                        desc: "Start your app. The license validates automatically. If valid, the app runs normally.",
                        color: "from-indigo-500 to-primary",
                      },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-md bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-sm font-bold text-white">{item.step}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{typeof item.desc === 'string' ? item.desc : item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border p-5 space-y-3 bg-muted/20">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-md bg-primary/15 flex items-center justify-center">
                      <Settings className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold">Configuration Example</h3>
                  </div>
                  <CodeBlock code={envSample} label=".env" />
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500/10 via-primary/10 to-purple-500/5 p-5 border-b">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-md bg-indigo-500/15 flex items-center justify-center">
                    <ArrowRight className="h-4.5 w-4.5 text-indigo-500" />
                  </div>
                  <h2 className="font-semibold text-lg">How It Works</h2>
                </div>
              </div>
              <div className="p-5">
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { icon: Key, title: "1. Seller Embeds SDK", desc: "The seller adds the CTRXL SDK to their source code. When the app starts, it checks the license before loading.", gradient: "from-primary/15 to-purple-500/15", iconColor: "text-primary" },
                    { icon: ShieldCheck, title: "2. License Validates", desc: "The SDK calls the CTRXL API with HMAC-signed requests and nonce challenge-response to validate the license securely.", gradient: "from-purple-500/15 to-indigo-500/15", iconColor: "text-purple-500" },
                    { icon: Play, title: "3. App Runs or Redirects", desc: "If the license is valid, the app runs normally. If invalid, the buyer is redirected to the install page to fix it.", gradient: "from-indigo-500/15 to-primary/15", iconColor: "text-indigo-500" },
                  ].map((item) => (
                    <div key={item.title} className={`space-y-3 p-4 rounded-md bg-gradient-to-br ${item.gradient} border`}>
                      <div className="h-10 w-10 rounded-md bg-background/80 flex items-center justify-center">
                        <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                      </div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeDemo === "validate" && (
          <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-primary/5 p-5 border-b">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-md bg-emerald-500/15 flex items-center justify-center">
                    <Server className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">API Validation Flow</h2>
                    <p className="text-sm text-muted-foreground">
                      HMAC-SHA256 signatures and nonce-based challenge-response prevent replay attacks and response tampering.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="font-mono text-xs bg-primary/10 text-primary border-primary/20">POST</Badge>
                    <code className="text-sm font-mono text-muted-foreground">/api/v1/licenses/validate</code>
                  </div>
                  <CodeBlock code={sampleValidateRequest} label="Request" />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Response (200 OK):</p>
                  <CodeBlock code={sampleValidateResponse} label="Response" />
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500/10 via-primary/10 to-purple-500/5 p-5 border-b">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-md bg-blue-500/15 flex items-center justify-center">
                    <Cpu className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">License Activation</h2>
                    <p className="text-sm text-muted-foreground">
                      Activate a license on a specific machine. Each license has a maximum number of allowed activations.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="font-mono text-xs bg-primary/10 text-primary border-primary/20">POST</Badge>
                  <code className="text-sm font-mono text-muted-foreground">/api/v1/licenses/activate</code>
                </div>
                <CodeBlock code={sampleActivateRequest} label="Request" />
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/5 p-5 border-b">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-md bg-amber-500/15 flex items-center justify-center">
                    <Lock className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Anti-Crack: Nonce Challenge-Response</h2>
                    <p className="text-sm text-muted-foreground">
                      Generate a nonce before validation to prevent replay attacks. The nonce is included in the HMAC signature.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="font-mono text-xs bg-primary/10 text-primary border-primary/20">POST</Badge>
                    <code className="text-sm font-mono text-muted-foreground">/api/v1/nonce</code>
                  </div>
                  <CodeBlock code={sampleNonceRequest} label="Request" />
                </div>

                <div className="space-y-3 pt-2">
                  <h3 className="font-medium text-sm">Security Features</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { icon: ShieldCheck, title: "HMAC-SHA256 Signatures", desc: "Every response is cryptographically signed to prevent tampering", color: "text-primary", bg: "bg-primary/10" },
                      { icon: RefreshCw, title: "Nonce Challenge-Response", desc: "One-time tokens prevent replay attacks", color: "text-purple-500", bg: "bg-purple-500/10" },
                      { icon: Lock, title: "Anti-Tamper Detection", desc: "SDK file integrity hash checks prevent code modification", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
                      { icon: BarChart3, title: "Heartbeat Monitoring", desc: "Periodic re-validation ensures continuous license compliance", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
                    ].map((f) => (
                      <div key={f.title} className="flex items-start gap-3 p-3 rounded-md border bg-muted/20">
                        <div className={`h-8 w-8 rounded-md ${f.bg} flex items-center justify-center flex-shrink-0`}>
                          <f.icon className={`h-4 w-4 ${f.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{f.title}</p>
                          <p className="text-xs text-muted-foreground">{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 via-purple-500/5 to-transparent p-5 border-b">
                <h3 className="font-semibold">All API Endpoints</h3>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { method: "POST", path: "/api/v1/licenses/validate", desc: "Validate a license key", auth: true },
                  { method: "POST", path: "/api/v1/licenses/activate", desc: "Activate license on a machine", auth: true },
                  { method: "POST", path: "/api/v1/licenses/deactivate", desc: "Deactivate a machine activation", auth: true },
                  { method: "GET", path: "/api/v1/licenses/info/:key", desc: "Public license info lookup", auth: false },
                  { method: "POST", path: "/api/v1/nonce", desc: "Generate nonce for challenge-response", auth: true },
                  { method: "POST", path: "/api/v1/licenses/verify-token", desc: "Verify validation token", auth: true },
                ].map((ep) => (
                  <div key={ep.path} className="flex items-start gap-3 p-3 rounded-md border bg-muted/10 flex-wrap">
                    <Badge className={`font-mono text-xs flex-shrink-0 ${ep.method === "GET" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-primary/10 text-primary border-primary/20"}`}>
                      {ep.method}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <code className="text-sm font-mono break-all">{ep.path}</code>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-xs text-muted-foreground">{ep.desc}</p>
                        {ep.auth && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            <Key className="h-2.5 w-2.5 mr-0.5" />
                            API Key
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeDemo === "sdk" && (
          <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-primary/5 p-5 border-b">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-md bg-cyan-500/15 flex items-center justify-center">
                    <Code2 className="h-4.5 w-4.5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">SDK Integration Examples</h2>
                    <p className="text-sm text-muted-foreground">
                      Download our SDK files from the Downloads page, then integrate them into your project.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <Tabs defaultValue="php">
                  <TabsList className="mb-4 flex-wrap">
                    <TabsTrigger value="php" data-testid="tab-sdk-php">
                      <FileCode className="h-3.5 w-3.5 mr-1.5" />
                      PHP
                    </TabsTrigger>
                    <TabsTrigger value="nextjs" data-testid="tab-sdk-nextjs">
                      <Globe className="h-3.5 w-3.5 mr-1.5" />
                      Next.js / TypeScript
                    </TabsTrigger>
                    <TabsTrigger value="python" data-testid="tab-sdk-python">
                      <Terminal className="h-3.5 w-3.5 mr-1.5" />
                      Python
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="php">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/15 rounded-md p-3">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">Requirements:</p>
                          <p>PHP 7.4+, cURL extension enabled, <code className="bg-muted px-1 py-0.5 rounded font-mono text-xs">LicenseGuard.php</code> from SDK Downloads</p>
                        </div>
                      </div>
                      <CodeBlock code={phpSdkSample} label="config.php" />
                    </div>
                  </TabsContent>

                  <TabsContent value="nextjs">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/15 rounded-md p-3">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">Requirements:</p>
                          <p>Node.js 18+, <code className="bg-muted px-1 py-0.5 rounded font-mono text-xs">license-guard.ts</code> from SDK Downloads</p>
                        </div>
                      </div>
                      <CodeBlock code={nextjsSdkSample} label="middleware.ts" />
                    </div>
                  </TabsContent>

                  <TabsContent value="python">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/15 rounded-md p-3">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">Requirements:</p>
                          <p>Python 3.8+, <code className="bg-muted px-1 py-0.5 rounded font-mono text-xs">requests</code> library, <code className="bg-muted px-1 py-0.5 rounded font-mono text-xs">license_guard.py</code> from SDK Downloads</p>
                        </div>
                      </div>
                      <CodeBlock code={pythonSdkSample} label="license_guard.py" />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-amber-500/5 p-5 border-b">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-md bg-red-500/15 flex items-center justify-center">
                    <ShieldCheck className="h-4.5 w-4.5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Anti-Crack Protection Layers</h2>
                    <p className="text-sm text-muted-foreground">
                      Multiple layers of protection prevent license bypass and code tampering.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {[
                  {
                    step: "1",
                    title: "HMAC-SHA256 Response Signing",
                    desc: "Server signs every validation response with a secret key. SDK verifies the signature to detect man-in-the-middle attacks or response forgery.",
                    gradient: "from-primary to-purple-500",
                  },
                  {
                    step: "2",
                    title: "Nonce Challenge-Response",
                    desc: "SDK generates a unique nonce before each validation request. The server includes this nonce in the signed response, preventing replay attacks.",
                    gradient: "from-purple-500 to-indigo-500",
                  },
                  {
                    step: "3",
                    title: "SDK File Integrity Check",
                    desc: "The SDK calculates its own file hash at runtime and compares it against the expected hash. If modified, it refuses to validate.",
                    gradient: "from-indigo-500 to-blue-500",
                  },
                  {
                    step: "4",
                    title: "Encrypted Cache with Checksums",
                    desc: "Cached validation results are encrypted and include checksums. If the cache file is manually edited, it's detected and rejected.",
                    gradient: "from-blue-500 to-cyan-500",
                  },
                  {
                    step: "5",
                    title: "Heartbeat Re-Validation",
                    desc: "Background periodic re-validation ensures the license remains valid even after initial startup. Configurable interval.",
                    gradient: "from-cyan-500 to-emerald-500",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3 p-3 rounded-md border bg-muted/10">
                    <div className={`h-8 w-8 rounded-md bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-sm font-bold text-white">{item.step}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeDemo === "portal" && (
          <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-primary/5 p-5 border-b">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-md bg-violet-500/15 flex items-center justify-center">
                    <Globe className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Customer Portal</h2>
                    <p className="text-sm text-muted-foreground">
                      Buyers look up their licenses by email. The portal shows all licenses including status, expiry, and installation links.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-5">
                <div className="rounded-md border p-5 bg-muted/20 space-y-4">
                  <h3 className="font-semibold text-sm">Portal Preview</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3.5 rounded-md bg-background border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-sm font-mono font-medium">{SAMPLE_LICENSE}</code>
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                            Active
                          </Badge>
                          <Badge variant="secondary" className="text-xs capitalize">standard</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                          <span>My Premium App</span>
                          <span>Expires: Jan 15, 2027</span>
                          <span>1/5 activations</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" data-testid="button-sample-install-link">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Install
                      </Button>
                    </div>

                    <div className="flex items-center gap-3 p-3.5 rounded-md bg-background border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-sm font-mono font-medium">CL-A3B-K7M-P2R-W9X</code>
                          <Badge variant="destructive" className="text-xs">
                            Expired
                          </Badge>
                          <Badge variant="secondary" className="text-xs capitalize">extended</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                          <span>Another Product</span>
                          <span>Expired: Dec 1, 2025</span>
                          <span>2/3 activations</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" data-testid="button-sample-install-link-2">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Install
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <Link href="/portal">
                    <Button data-testid="link-portal">
                      <Globe className="h-4 w-4 mr-1.5" />
                      Go to Customer Portal
                    </Button>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    Try it live with a real email address
                  </p>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/5 p-5 border-b">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-md bg-amber-500/15 flex items-center justify-center">
                    <HelpCircle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h2 className="font-semibold text-lg">Troubleshooting Guide</h2>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-muted-foreground">
                  The installation page includes a built-in troubleshooting section that helps buyers resolve common issues.
                </p>
                <div className="space-y-3">
                  {[
                    { q: "I keep getting redirected back to the install page", a: "Check that your API key and license key are correctly set in the .env file. Make sure the .env file is in the project root." },
                    { q: "Where do I get the API key?", a: "The API key is provided by the seller. It starts with cl_ and looks like: cl_xxxxxxxxxxxxxxxx" },
                    { q: "My license shows as expired or inactive", a: "Contact the seller to renew or reactivate your license." },
                    { q: "Can I use this license on multiple domains?", a: "If your license has domain restrictions, it will only work on the allowed domains. Contact the seller to add more domains." },
                  ].map((item, i) => (
                    <div key={item.q} className="p-3.5 rounded-md border bg-muted/10 space-y-1">
                      <p className="font-medium text-sm flex items-start gap-2">
                        <span className="text-primary font-bold text-xs mt-0.5">Q{i + 1}</span>
                        {item.q}
                      </p>
                      <p className="text-sm text-muted-foreground pl-6">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        <footer className="py-8 text-center text-sm text-muted-foreground border-t">
          <p>Powered by <span className="font-medium text-foreground">CTRXL LICENSE</span></p>
        </footer>
      </div>
    </div>
  );
}
