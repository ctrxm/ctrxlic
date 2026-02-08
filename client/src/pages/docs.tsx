import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, CheckCircle2, Code2, Globe, FileCode, Terminal } from "lucide-react";
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
      <div className="absolute top-2 right-2 z-10">
        <Button
          size="icon"
          variant="ghost"
          onClick={copy}
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
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
    description: "Activate a license on a specific machine",
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
    description: "Deactivate a license from a specific machine",
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

// === OPTION 1: Auto-redirect to install page if license invalid ===
// Add this to your bootstrap/config file (e.g. config.php, index.php)
$lg = new LicenseGuard('your_api_key_here', 'CL-XXX-XXX-XXX-XXX');
$lg->validateOrRedirect(); // Redirects buyer to install page automatically

// === OPTION 2: Manual validation with custom handling ===
$lg = new LicenseGuard('your_api_key_here', 'CL-XXX-XXX-XXX-XXX');

try {
    $result = $lg->validate($_SERVER['HTTP_HOST'], null, gethostname());
    
    if ($result->valid) {
        echo "License is valid!\\n";
        echo "Type: " . $result->license->type . "\\n";
    } else {
        // Redirect to installation page
        header('Location: ' . $lg->getInstallUrl());
        exit;
    }
} catch (Exception $e) {
    // Redirect to installation page on error
    header('Location: ' . $lg->getInstallUrl());
    exit;
}`;

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

  async activate(machineId: string, hostname?: string) {
    const response = await fetch(\`\${this.baseUrl}/api/v1/licenses/activate\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify({
        license_key: this.licenseKey,
        machine_id: machineId,
        hostname,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Activation failed');
    }

    return response.json();
  }

  async deactivate(machineId: string) {
    const response = await fetch(\`\${this.baseUrl}/api/v1/licenses/deactivate\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify({
        license_key: this.licenseKey,
        machine_id: machineId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Deactivation failed');
    }

    return response.json();
  }
}

// === OPTION 1: Auto-redirect in Next.js middleware ===
// middleware.ts (root of your Next.js project)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const lg = new LicenseGuard(
  process.env.CTRXL_API_KEY!,
  process.env.CTRXL_LICENSE_KEY! // e.g. 'CL-XXX-XXX-XXX-XXX'
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
}

// === OPTION 2: Validate in API route ===
// app/api/check-license/route.ts
export async function GET() {
  try {
    const result = await lg.validate();
    if (!result.valid) {
      return NextResponse.json({ 
        valid: false, 
        installUrl: lg.getInstallUrl() 
      });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { valid: false, installUrl: lg.getInstallUrl() },
      { status: 400 }
    );
  }
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
    
    def activate(self, machine_id: str, hostname: Optional[str] = None) -> dict:
        return self._request('POST', '/api/v1/licenses/activate', {
            'license_key': self.license_key,
            'machine_id': machine_id,
            'hostname': hostname,
        })
    
    def deactivate(self, machine_id: str) -> dict:
        return self._request('POST', '/api/v1/licenses/deactivate', {
            'license_key': self.license_key,
            'machine_id': machine_id,
        })
    
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


# === OPTION 1: Auto-redirect with Flask ===
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
        return redirect(lg.get_install_url())

# === OPTION 2: Manual validation ===
lg = LicenseGuard('your_api_key_here', 'CL-XXX-XXX-XXX-XXX')

try:
    result = lg.validate(machine_id=socket.gethostname())
    
    if result['valid']:
        print(f"License valid! Type: {result['license']['type']}")
    else:
        print(f"License invalid! Install at: {lg.get_install_url()}")
except Exception as e:
    print(f"Error: {e}")
    print(f"Visit: {lg.get_install_url()}")`;

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
  return (
    <div className="p-6 space-y-8 max-w-[1000px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">API Documentation</h1>
        <p className="text-muted-foreground mt-1">
          Integrate license validation into your application
        </p>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-3">Authentication</h2>
        <p className="text-sm text-muted-foreground mb-4">
          All API requests require an API key sent via the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">X-API-Key</code> header.
          Create API keys from the <a href="/api-keys" className="text-primary underline">API Keys</a> page.
        </p>
        <CodeBlock
          code={`curl -H "X-API-Key: your_api_key_here" ${baseUrl}/api/v1/licenses/validate`}
          language="bash"
        />
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

      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-3">Auto-Redirect Flow</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Embed auto-redirect into your source code so that when a buyer opens the application without a valid license, they are automatically redirected to the license installation page.
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary" data-testid="text-flow-step-1">1</span>
            </div>
            <div>
              <p className="font-medium text-sm">Create Product & License</p>
              <p className="text-sm text-muted-foreground">
                Create a product and generate a license key (e.g. <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">CL-XXX-XXX-XXX-XXX</code>) from the dashboard.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary" data-testid="text-flow-step-2">2</span>
            </div>
            <div>
              <p className="font-medium text-sm">Embed SDK in Source Code</p>
              <p className="text-sm text-muted-foreground">
                Add the LicenseGuard SDK to your source code with the <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">validateOrRedirect()</code> method. This will auto-redirect users to the install page if the license is invalid.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary" data-testid="text-flow-step-3">3</span>
            </div>
            <div>
              <p className="font-medium text-sm">Buyer Opens Application</p>
              <p className="text-sm text-muted-foreground">
                When the buyer runs your source code, the SDK validates the license. If invalid, the buyer is automatically redirected to:
              </p>
              <code className="block mt-1 bg-muted px-2 py-1.5 rounded text-xs font-mono" data-testid="text-install-url-example">
                {baseUrl}/install/CL-XXX-XXX-XXX-XXX
              </code>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary" data-testid="text-flow-step-4">4</span>
            </div>
            <div>
              <p className="font-medium text-sm">Buyer Sees License Info & Setup Guide</p>
              <p className="text-sm text-muted-foreground">
                The installation page shows license details, status, allowed domains, and step-by-step integration instructions with code snippets for the buyer.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="font-semibold text-lg mb-4">SDK Integration</h2>
        <Tabs defaultValue="php">
          <TabsList className="mb-4">
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
  );
}
