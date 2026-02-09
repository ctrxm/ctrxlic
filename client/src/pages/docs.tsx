import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  CheckCircle2,
  Code2,
  Globe,
  FileCode,
  Terminal,
  ArrowRight,
  ShieldCheck,
  Package,
  Send,
  Users,
  BookOpen,
} from "lucide-react";
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
        <Button
          size="icon"
          variant="ghost"
          onClick={copy}
        >
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

const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

const endpoints = [
  {
    method: "POST",
    path: "/api/v1/licenses/validate",
    description: "Validate a license key. Optionally include product_id, domain, or machine_id for additional checks.",
    headers: `X-API-Key: your_api_key_here
Content-Type: application/json`,
    body: `{
  "license_key": "CL-XXX-XXX-XXX-XXX",
  "product_id": "your-product-slug",
  "domain": "yourdomain.com",
  "machine_id": "optional-machine-identifier"
}`,
    response: `{
  "valid": true,
  "license": {
    "type": "standard",
    "status": "active",
    "customer_name": "John Doe",
    "expires_at": "2027-01-15T00:00:00Z",
    "activations": 1,
    "max_activations": 5
  }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/licenses/info/:key",
    description: "Get public license information (no API key required). Returns license details for the installation page.",
    headers: `Content-Type: application/json`,
    body: `// No request body needed
// Example: GET /api/v1/licenses/info/CL-XXX-XXX-XXX-XXX`,
    response: `{
  "licenseKey": "CL-XXX-XXX-XXX-XXX",
  "productName": "My Product",
  "type": "standard",
  "status": "active",
  "customerName": "John Doe",
  "expiresAt": "2027-01-15T00:00:00Z",
  "allowedDomains": ["example.com"]
}`,
  },
  {
    method: "POST",
    path: "/api/v1/licenses/activate",
    description: "Activate a license on a specific machine. Requires API key.",
    headers: `X-API-Key: your_api_key_here
Content-Type: application/json`,
    body: `{
  "license_key": "CL-XXX-XXX-XXX-XXX",
  "machine_id": "unique-machine-id",
  "hostname": "optional-hostname"
}`,
    response: `{
  "success": true,
  "activation": {
    "id": "act_xxxxx",
    "machine_id": "unique-machine-id",
    "activated_at": "2026-02-08T10:30:00Z"
  }
}`,
  },
  {
    method: "POST",
    path: "/api/v1/licenses/deactivate",
    description: "Deactivate a license from a specific machine. Requires API key.",
    headers: `X-API-Key: your_api_key_here
Content-Type: application/json`,
    body: `{
  "license_key": "CL-XXX-XXX-XXX-XXX",
  "machine_id": "unique-machine-id"
}`,
    response: `{
  "success": true,
  "message": "License deactivated successfully"
}`,
  },
];

const phpCode = `<?php
/**
 * CTRXL LicenseGuard PHP SDK
 * Add this class to your project to validate licenses
 * Includes auto-redirect to installation page for buyers
 */
class LicenseGuard {
    private string $apiKey;
    private string $baseUrl;
    private string $licenseKey;
    
    public function __construct(string $apiKey, string $licenseKey, string $baseUrl = '${baseUrl}') {
        $this->apiKey = $apiKey;
        $this->licenseKey = $licenseKey;
        $this->baseUrl = rtrim($baseUrl, '/');
    }
    
    public function getInstallUrl(): string {
        return $this->baseUrl . '/install/' . urlencode($this->licenseKey);
    }
    
    public function validate(?string $domain = null, ?string $productId = null, ?string $machineId = null): object {
        $payload = [
            'license_key' => $this->licenseKey,
        ];
        if ($domain) $payload['domain'] = $domain;
        if ($productId) $payload['product_id'] = $productId;
        if ($machineId) $payload['machine_id'] = $machineId;
        
        return $this->request('POST', '/api/v1/licenses/validate', $payload);
    }
    
    public function validateOrRedirect(?string $domain = null, ?string $productId = null): void {
        $result = $this->validate($domain ?? ($_SERVER['HTTP_HOST'] ?? ''), $productId);
        
        if (!$result->valid) {
            header('Location: ' . $this->getInstallUrl());
            exit;
        }
    }
    
    public function activate(string $machineId, ?string $hostname = null): object {
        return $this->request('POST', '/api/v1/licenses/activate', [
            'license_key' => $this->licenseKey,
            'machine_id' => $machineId,
            'hostname' => $hostname,
        ]);
    }
    
    public function deactivate(string $machineId): object {
        return $this->request('POST', '/api/v1/licenses/deactivate', [
            'license_key' => $this->licenseKey,
            'machine_id' => $machineId,
        ]);
    }
    
    private function request(string $method, string $path, array $data = []): object {
        $ch = curl_init($this->baseUrl . $path);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'X-API-Key: ' . $this->apiKey,
            ],
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_POSTFIELDS => json_encode($data),
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $result = json_decode($response);
        
        if ($httpCode !== 200) {
            throw new Exception("License validation failed: " . ($result->message ?? 'Unknown error'));
        }
        
        return $result;
    }
}

// === Auto-redirect to install page if license invalid ===
$lg = new LicenseGuard('your_api_key_here', 'CL-XXX-XXX-XXX-XXX');
$lg->validateOrRedirect();`;

const nextjsCode = `// lib/license-guard.ts
interface ValidateResult {
  valid: boolean;
  license?: {
    type: string;
    status: string;
    customer_name: string;
    expires_at: string;
    activations: number;
    max_activations: number;
  };
  message?: string;
}

class LicenseGuard {
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

  async validate(domain?: string, productId?: string, machineId?: string): Promise<ValidateResult> {
    const payload: Record<string, string | undefined> = {
      license_key: this.licenseKey,
      domain,
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Validation failed');
    }

    return response.json();
  }
}

// === Next.js Middleware (auto-redirect) ===
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const lg = new LicenseGuard(
  process.env.CTRXL_API_KEY!,
  process.env.CTRXL_LICENSE_KEY!
);

export async function middleware(request: NextRequest) {
  try {
    const result = await lg.validate(request.headers.get('host') || '');
    if (!result.valid) {
      return NextResponse.redirect(lg.getInstallUrl());
    }
  } catch {
    return NextResponse.redirect(lg.getInstallUrl());
  }
  return NextResponse.next();
}`;

const pythonCode = `import requests
import socket
from typing import Optional
from urllib.parse import quote

class LicenseGuard:
    """CTRXL LicenseGuard Python SDK with auto-redirect support"""
    
    def __init__(self, api_key: str, license_key: str, base_url: str = '${baseUrl}'):
        self.api_key = api_key
        self.license_key = license_key
        self.base_url = base_url.rstrip('/')
    
    def get_install_url(self) -> str:
        return f'{self.base_url}/install/{quote(self.license_key)}'
    
    def validate(self, domain: Optional[str] = None, product_id: Optional[str] = None, machine_id: Optional[str] = None) -> dict:
        payload = {
            'license_key': self.license_key,
        }
        if domain:
            payload['domain'] = domain
        if product_id:
            payload['product_id'] = product_id
        if machine_id:
            payload['machine_id'] = machine_id
        
        return self._request('POST', '/api/v1/licenses/validate', payload)
    
    def _request(self, method: str, path: str, data: dict) -> dict:
        response = requests.request(
            method,
            f'{self.base_url}{path}',
            json=data,
            headers={
                'Content-Type': 'application/json',
                'X-API-Key': self.api_key,
            }
        )
        response.raise_for_status()
        return response.json()


# === Flask Auto-Redirect ===
from flask import Flask, redirect
app = Flask(__name__)

lg = LicenseGuard('your_api_key_here', 'CL-XXX-XXX-XXX-XXX')

@app.before_request
def check_license():
    try:
        result = lg.validate()
        if not result.get('valid'):
            return redirect(lg.get_install_url())
    except Exception:
        return redirect(lg.get_install_url())`;

const curlCode = `# Validate a license
curl -X POST ${baseUrl}/api/v1/licenses/validate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your_api_key_here" \\
  -d '{
    "license_key": "CL-XXX-XXX-XXX-XXX",
    "domain": "yourdomain.com"
  }'

# Get license info (public, no API key needed)
curl ${baseUrl}/api/v1/licenses/info/CL-XXX-XXX-XXX-XXX

# Install page URL for buyers:
# ${baseUrl}/install/CL-XXX-XXX-XXX-XXX

# Activate a license
curl -X POST ${baseUrl}/api/v1/licenses/activate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your_api_key_here" \\
  -d '{
    "license_key": "CL-XXX-XXX-XXX-XXX",
    "machine_id": "my-machine-001",
    "hostname": "workstation-1"
  }'

# Deactivate a license
curl -X POST ${baseUrl}/api/v1/licenses/deactivate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your_api_key_here" \\
  -d '{
    "license_key": "CL-XXX-XXX-XXX-XXX",
    "machine_id": "my-machine-001"
  }'`;

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<"flow" | "api" | "sdk">("flow");

  return (
    <div className="p-6 space-y-8 max-w-[1000px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documentation</h1>
        <p className="text-muted-foreground mt-1">
          Complete guide for integrating license protection into your source code
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeTab === "flow" ? "default" : "outline"}
          onClick={() => setActiveTab("flow")}
          data-testid="button-doc-flow"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          How It Works
        </Button>
        <Button
          variant={activeTab === "api" ? "default" : "outline"}
          onClick={() => setActiveTab("api")}
          data-testid="button-doc-api"
        >
          <Code2 className="h-4 w-4 mr-2" />
          API Reference
        </Button>
        <Button
          variant={activeTab === "sdk" ? "default" : "outline"}
          onClick={() => setActiveTab("sdk")}
          data-testid="button-doc-sdk"
        >
          <FileCode className="h-4 w-4 mr-2" />
          SDK Code
        </Button>
      </div>

      {activeTab === "flow" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">License Protection Flow</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              CTRXL LICENSE works like CodeCanyon's license system. You embed a license check in your source code before selling it. 
              When a buyer runs the application, the SDK validates their license. If invalid, they're automatically redirected to the installation page.
            </p>
          </Card>

          <Card className="p-5 space-y-5">
            <h2 className="font-semibold text-lg">Complete Workflow</h2>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <h3 className="font-medium text-sm">Phase 1: Seller Setup (You)</h3>
                </div>
                <div className="ml-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary" data-testid="text-flow-step-1">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Create Product & License</p>
                      <p className="text-sm text-muted-foreground">
                        Go to <a href="/products" className="text-primary underline">Products</a> and create your product. Then go to <a href="/licenses" className="text-primary underline">Licenses</a> and generate a license key.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary" data-testid="text-flow-step-2">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Create API Key</p>
                      <p className="text-sm text-muted-foreground">
                        Go to <a href="/api-keys" className="text-primary underline">API Keys</a> and create an API key. You'll give this to your buyer or embed it in a config file.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary" data-testid="text-flow-step-3">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Download SDK & Embed in Source Code</p>
                      <p className="text-sm text-muted-foreground">
                        Download the SDK from <a href="/downloads" className="text-primary underline">SDK Downloads</a>, add it to your project, and call <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">validateOrRedirect()</code> in your app's entry point.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary" data-testid="text-flow-step-4">4</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Include .env.example & README</p>
                      <p className="text-sm text-muted-foreground">
                        Create a <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">.env.example</code> file with placeholders for <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">CTRXL_API_KEY</code> and <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">CTRXL_LICENSE_KEY</code>.
                        Include a README with installation instructions. Download templates from the <a href="/downloads" className="text-primary underline">SDK Downloads</a> page.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" />
                  <h3 className="font-medium text-sm">Phase 2: Sell & Distribute</h3>
                </div>
                <div className="ml-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">5</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Package Your Source Code</p>
                      <p className="text-sm text-muted-foreground">
                        Zip your project with the SDK file, .env.example, and README. Sell on CodeCanyon, Gumroad, your own website, etc.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">6</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Send License Key to Buyer</p>
                      <p className="text-sm text-muted-foreground">
                        After purchase, send the buyer their license key and API key. You can also optionally set domain restrictions for extra protection.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="font-medium text-sm">Phase 3: Buyer Experience</h3>
                </div>
                <div className="ml-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">7</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Buyer Opens Application</p>
                      <p className="text-sm text-muted-foreground">
                        If the license is not configured yet, the buyer is automatically redirected to:
                      </p>
                      <code className="block mt-1 bg-muted px-2 py-1.5 rounded text-xs font-mono" data-testid="text-install-url-example">
                        {baseUrl}/install/CL-XXX-XXX-XXX-XXX
                      </code>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">8</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Buyer Sees Setup Guide</p>
                      <p className="text-sm text-muted-foreground">
                        The installation page shows their license details, status, configuration examples with their license key pre-filled, and troubleshooting tips. 
                        Once they configure the <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">.env</code> file correctly and restart the app, it runs normally.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <h2 className="font-semibold text-lg">Visual Flow</h2>
            <div className="bg-muted/50 rounded-md p-4">
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge>You: Create License</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  <Badge variant="secondary">Embed SDK in Code</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  <Badge variant="secondary">Sell Source Code</Badge>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge>Buyer: Opens App</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  <Badge variant="secondary">SDK Checks License</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  <Badge variant="secondary">No License? Redirect to Install Page</Badge>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge>Buyer: Configures .env</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  <Badge variant="secondary">Restarts App</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20">App Runs Normally</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "api" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="p-5">
            <h2 className="font-semibold text-lg mb-3">Authentication</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Most API requests require an API key sent via the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">X-API-Key</code> header.
              Create API keys from the <a href="/api-keys" className="text-primary underline">API Keys</a> page.
              The <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">GET /info/:key</code> endpoint is public and doesn't require authentication.
            </p>
            <CodeBlock
              code={`curl -H "X-API-Key: cl_xxxxxxxxxxxxxxxx" ${baseUrl}/api/v1/licenses/validate`}
              language="bash"
            />
          </Card>

          <Card className="p-5 space-y-3">
            <h2 className="font-semibold text-lg">Base URL</h2>
            <p className="text-sm text-muted-foreground">
              All API endpoints are relative to your CTRXL LICENSE instance:
            </p>
            <code className="block bg-muted px-3 py-2 rounded text-sm font-mono">{baseUrl}</code>
          </Card>

          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Endpoints</h2>
            {endpoints.map((endpoint) => (
              <Card key={endpoint.path} className="p-5">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge className="font-mono text-xs">{endpoint.method}</Badge>
                  <code className="text-sm font-mono">{endpoint.path}</code>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{endpoint.description}</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Headers</p>
                    <CodeBlock code={endpoint.headers} language="text" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Request Body</p>
                    <CodeBlock code={endpoint.body} language="json" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Response</p>
                    <CodeBlock code={endpoint.response} language="json" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-5 space-y-3">
            <h2 className="font-semibold text-lg">Error Responses</h2>
            <p className="text-sm text-muted-foreground">
              All API errors return a JSON object with a <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">message</code> field.
            </p>
            <CodeBlock code={`// 401 Unauthorized
{
  "message": "Invalid or missing API key"
}

// 404 Not Found
{
  "message": "License not found"
}

// 400 Bad Request
{
  "message": "license_key is required"
}

// 200 OK (but invalid license)
{
  "valid": false,
  "message": "License expired"
}`} language="json" />
          </Card>
        </div>
      )}

      {activeTab === "sdk" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">
              Complete SDK code examples for all supported languages. For downloadable SDK files and framework-specific integration guides (Laravel, WordPress, Django, FastAPI, Express.js), visit the <a href="/downloads" className="text-primary underline">SDK Downloads</a> page.
            </p>
          </Card>

          <div>
            <h2 className="font-semibold text-lg mb-4">SDK Integration</h2>
            <Tabs defaultValue="php">
              <TabsList className="mb-4 flex-wrap">
                <TabsTrigger value="php" data-testid="tab-php">
                  <FileCode className="h-3.5 w-3.5 mr-1.5" />
                  PHP
                </TabsTrigger>
                <TabsTrigger value="nextjs" data-testid="tab-nextjs">
                  <Globe className="h-3.5 w-3.5 mr-1.5" />
                  Next.js
                </TabsTrigger>
                <TabsTrigger value="python" data-testid="tab-python">
                  <Code2 className="h-3.5 w-3.5 mr-1.5" />
                  Python
                </TabsTrigger>
                <TabsTrigger value="curl" data-testid="tab-curl">
                  <Terminal className="h-3.5 w-3.5 mr-1.5" />
                  cURL
                </TabsTrigger>
              </TabsList>
              <TabsContent value="php">
                <Card className="p-5">
                  <CodeBlock code={phpCode} language="php" />
                </Card>
              </TabsContent>
              <TabsContent value="nextjs">
                <Card className="p-5">
                  <CodeBlock code={nextjsCode} language="typescript" />
                </Card>
              </TabsContent>
              <TabsContent value="python">
                <Card className="p-5">
                  <CodeBlock code={pythonCode} language="python" />
                </Card>
              </TabsContent>
              <TabsContent value="curl">
                <Card className="p-5">
                  <CodeBlock code={curlCode} language="bash" />
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}
