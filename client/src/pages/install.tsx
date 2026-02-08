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
} from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

function CodeBlock({ code, language }: { code: string; language: string }) {
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
            <p className="text-muted-foreground">
              The license key provided is invalid or does not exist.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const phpInstallCode = `<?php
/**
 * CTRXL License Validator
 * Add this to your application bootstrap (e.g. config.php, index.php)
 * Auto-redirects buyers to install page if license is invalid
 */
class CTRXLLicense {
    private string \\$apiKey;
    private string \\$baseUrl;
    private string \\$licenseKey;
    
    public function __construct(string \\$apiKey, string \\$licenseKey, string \\$baseUrl = '${baseUrl}') {
        \\$this->apiKey = \\$apiKey;
        \\$this->licenseKey = \\$licenseKey;
        \\$this->baseUrl = rtrim(\\$baseUrl, '/');
    }
    
    public function getInstallUrl(): string {
        return \\$this->baseUrl . '/install/' . urlencode(\\$this->licenseKey);
    }
    
    public function validate(?string \\$domain = null, ?string \\$productId = null, ?string \\$machineId = null): object {
        \\$payload = [
            'license_key' => \\$this->licenseKey,
            'domain' => \\$domain ?? \\$_SERVER['HTTP_HOST'] ?? '',
        ];
        if (\\$productId) \\$payload['product_id'] = \\$productId;
        if (\\$machineId) \\$payload['machine_id'] = \\$machineId;
        
        \\$ch = curl_init(\\$this->baseUrl . '/api/v1/licenses/validate');
        curl_setopt_array(\\$ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'X-API-Key: ' . \\$this->apiKey,
            ],
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode(\\$payload),
        ]);
        
        \\$response = curl_exec(\\$ch);
        curl_close(\\$ch);
        
        return json_decode(\\$response);
    }
    
    public function validateOrRedirect(?string \\$domain = null): void {
        \\$result = \\$this->validate(\\$domain);
        
        if (!\\$result->valid) {
            header('Location: ' . \\$this->getInstallUrl());
            exit;
        }
    }
}

// Add this to your config.php or bootstrap file:
\\$license = new CTRXLLicense('YOUR_API_KEY', '${licenseKey}');

// Auto-redirect to install page if license is invalid
\\$license->validateOrRedirect();

// If we reach here, the license is valid!
// Your application continues normally...`;

  const nextjsInstallCode = `// lib/ctrxl-license.ts
class CTRXLLicense {
  private apiKey: string;
  private baseUrl: string;
  private licenseKey: string;

  constructor(apiKey: string, licenseKey: string, baseUrl: string = '${baseUrl}') {
    this.apiKey = apiKey;
    this.licenseKey = licenseKey;
    this.baseUrl = baseUrl.replace(/\\/$/, '');
  }

  getInstallUrl(): string {
    return \`\${this.baseUrl}/install/\${encodeURIComponent(this.licenseKey)}\`;
  }

  async validate(domain?: string, productId?: string, machineId?: string): Promise<any> {
    const payload: Record<string, string | undefined> = {
      license_key: this.licenseKey,
      domain: domain || (typeof window !== 'undefined' ? window.location.hostname : ''),
      product_id: productId,
      machine_id: machineId,
    };
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    const response = await fetch(\`\${this.baseUrl}/api/v1/licenses/validate\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify(payload),
    });

    return response.json();
  }
}

// === Usage in Next.js middleware.ts ===
// Auto-redirect buyers to install page if license invalid
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const license = new CTRXLLicense(
  process.env.CTRXL_API_KEY!,
  '${licenseKey}'
);

export async function middleware(request: NextRequest) {
  try {
    const result = await license.validate(request.headers.get('host') || '');
    if (!result.valid) {
      return NextResponse.redirect(license.getInstallUrl());
    }
  } catch {
    return NextResponse.redirect(license.getInstallUrl());
  }
  return NextResponse.next();
}`;

  const pythonInstallCode = `import requests
from urllib.parse import quote

class CTRXLLicense:
    def __init__(self, api_key: str, license_key: str, base_url: str = '${baseUrl}'):
        self.api_key = api_key
        self.license_key = license_key
        self.base_url = base_url.rstrip('/')
    
    def get_install_url(self) -> str:
        return f'{self.base_url}/install/{quote(self.license_key)}'
    
    def validate(self, domain: str = '', product_id: str = None, machine_id: str = None) -> dict:
        payload = {
            'license_key': self.license_key,
            'domain': domain,
        }
        if product_id:
            payload['product_id'] = product_id
        if machine_id:
            payload['machine_id'] = machine_id
        response = requests.post(
            f'{self.base_url}/api/v1/licenses/validate',
            json=payload,
            headers={
                'Content-Type': 'application/json',
                'X-API-Key': self.api_key,
            }
        )
        return response.json()

# === Usage with Flask (auto-redirect) ===
from flask import Flask, redirect
app = Flask(__name__)

license = CTRXLLicense('YOUR_API_KEY', '${licenseKey}')

@app.before_request
def check_license():
    try:
        result = license.validate()
        if not result.get('valid'):
            return redirect(license.get_install_url())
    except Exception:
        return redirect(license.get_install_url())

# If license is valid, your app runs normally!`;

  const curlInstallCode = `# Validate your license
curl -X POST ${baseUrl}/api/v1/licenses/validate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "license_key": "${licenseKey}",
    "domain": "yourdomain.com"
  }'

# View license info (no API key needed)
curl ${baseUrl}/api/v1/licenses/info/${licenseKey}

# Your install page URL:
# ${baseUrl}/install/${licenseKey}`;

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
            Follow the steps below to integrate your license into your application
          </p>
        </div>

        <Card className="p-5 space-y-4">
          <h2 className="font-semibold text-lg">License Information</h2>
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
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <div className="flex items-center gap-1.5">
                {licenseInfo.status === "active" ? (
                  <CheckCircle2 className="h-4 w-4 text-chart-2" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="text-sm capitalize" data-testid="text-install-status">{licenseInfo.status}</span>
              </div>
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

        <Card className="p-5 space-y-4">
          <h2 className="font-semibold text-lg">Quick Start</h2>
          <p className="text-sm text-muted-foreground">
            This license has been embedded in your source code. Follow these steps to activate it:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium text-sm">Get your API Key</p>
                <p className="text-sm text-muted-foreground">
                  Your source code provider will give you an API key. If you have a CTRXL LICENSE dashboard account, you can also create one there.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium text-sm">Configure Your Application</p>
                <p className="text-sm text-muted-foreground">
                  Your source code already includes the license validation SDK. Replace <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">YOUR_API_KEY</code> with the API key from step 1 in your configuration file.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium text-sm">Set Up Your Domain</p>
                <p className="text-sm text-muted-foreground">
                  {licenseInfo.allowedDomains && licenseInfo.allowedDomains.length > 0
                    ? "Make sure your application runs on one of the allowed domains listed above."
                    : "Deploy your application to any domain. No domain restrictions apply to this license."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <div>
                <p className="font-medium text-sm">Deploy & Verify</p>
                <p className="text-sm text-muted-foreground">
                  Deploy your application. The license is validated automatically. If the license is active and valid, your app runs normally.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div>
          <h2 className="font-semibold text-lg mb-4">Integration Code</h2>
          <Tabs defaultValue="php">
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="php" data-testid="tab-install-php">
                <FileCode className="h-3.5 w-3.5 mr-1.5" />
                PHP
              </TabsTrigger>
              <TabsTrigger value="nextjs" data-testid="tab-install-nextjs">
                <Globe className="h-3.5 w-3.5 mr-1.5" />
                Next.js
              </TabsTrigger>
              <TabsTrigger value="python" data-testid="tab-install-python">
                <Code2 className="h-3.5 w-3.5 mr-1.5" />
                Python
              </TabsTrigger>
              <TabsTrigger value="curl" data-testid="tab-install-curl">
                <Terminal className="h-3.5 w-3.5 mr-1.5" />
                cURL
              </TabsTrigger>
            </TabsList>
            <TabsContent value="php">
              <Card className="p-5">
                <CodeBlock code={phpInstallCode} language="php" />
              </Card>
            </TabsContent>
            <TabsContent value="nextjs">
              <Card className="p-5">
                <CodeBlock code={nextjsInstallCode} language="typescript" />
              </Card>
            </TabsContent>
            <TabsContent value="python">
              <Card className="p-5">
                <CodeBlock code={pythonInstallCode} language="python" />
              </Card>
            </TabsContent>
            <TabsContent value="curl">
              <Card className="p-5">
                <CodeBlock code={curlInstallCode} language="bash" />
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <footer className="py-8 text-center text-sm text-muted-foreground border-t">
          <p>Powered by CTRXL LICENSE</p>
        </footer>
      </div>
    </div>
  );
}
