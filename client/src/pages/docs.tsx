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
    description: "Validate a license key and optionally activate it on a machine",
    body: `{
  "license_key": "LG-XXXX-XXXX-XXXX-XXXX",
  "product_id": "your-product-slug",
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
    method: "POST",
    path: "/api/v1/licenses/activate",
    description: "Activate a license on a specific machine",
    body: `{
  "license_key": "LG-XXXX-XXXX-XXXX-XXXX",
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
  "license_key": "LG-XXXX-XXXX-XXXX-XXXX",
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
 * LicenseGuard PHP SDK
 * Add this class to your project to validate licenses
 */
class LicenseGuard {
    private string $apiKey;
    private string $baseUrl;
    
    public function __construct(string $apiKey, string $baseUrl = '${baseUrl}') {
        $this->apiKey = $apiKey;
        $this->baseUrl = rtrim($baseUrl, '/');
    }
    
    public function validate(string $licenseKey, string $productId, ?string $machineId = null): object {
        $payload = [
            'license_key' => $licenseKey,
            'product_id' => $productId,
        ];
        
        if ($machineId) {
            $payload['machine_id'] = $machineId;
        }
        
        return $this->request('POST', '/api/v1/licenses/validate', $payload);
    }
    
    public function activate(string $licenseKey, string $machineId, ?string $hostname = null): object {
        return $this->request('POST', '/api/v1/licenses/activate', [
            'license_key' => $licenseKey,
            'machine_id' => $machineId,
            'hostname' => $hostname,
        ]);
    }
    
    public function deactivate(string $licenseKey, string $machineId): object {
        return $this->request('POST', '/api/v1/licenses/deactivate', [
            'license_key' => $licenseKey,
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

// Usage Example
$lg = new LicenseGuard('your_api_key_here');

try {
    $result = $lg->validate(
        'LG-XXXX-XXXX-XXXX-XXXX',
        'your-product-slug',
        gethostname()
    );
    
    if ($result->valid) {
        echo "License is valid!\\n";
        echo "Type: " . $result->license->type . "\\n";
        echo "Expires: " . $result->license->expires_at . "\\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\\n";
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

  constructor(apiKey: string, baseUrl: string = '${baseUrl}') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\\/$/, '');
  }

  async validate(
    licenseKey: string,
    productId: string,
    machineId?: string
  ): Promise<ValidateResult> {
    const response = await fetch(\`\${this.baseUrl}/api/v1/licenses/validate\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify({
        license_key: licenseKey,
        product_id: productId,
        machine_id: machineId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Validation failed');
    }

    return response.json();
  }

  async activate(licenseKey: string, machineId: string, hostname?: string) {
    const response = await fetch(\`\${this.baseUrl}/api/v1/licenses/activate\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify({
        license_key: licenseKey,
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

  async deactivate(licenseKey: string, machineId: string) {
    const response = await fetch(\`\${this.baseUrl}/api/v1/licenses/deactivate\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify({
        license_key: licenseKey,
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

// Usage in Next.js API Route
// app/api/check-license/route.ts
import { NextResponse } from 'next/server';
import os from 'os';

const lg = new LicenseGuard(process.env.LG_API_KEY!);

export async function POST(request: Request) {
  const { licenseKey } = await request.json();
  
  try {
    const result = await lg.validate(
      licenseKey,
      'your-product-slug',
      os.hostname()
    );
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { valid: false, message: 'License validation failed' },
      { status: 400 }
    );
  }
}`;

const pythonCode = `import requests
import socket
from typing import Optional

class LicenseGuard:
    """LicenseGuard Python SDK"""
    
    def __init__(self, api_key: str, base_url: str = '${baseUrl}'):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
    
    def validate(
        self,
        license_key: str,
        product_id: str,
        machine_id: Optional[str] = None
    ) -> dict:
        payload = {
            'license_key': license_key,
            'product_id': product_id,
        }
        if machine_id:
            payload['machine_id'] = machine_id
        
        return self._request('POST', '/api/v1/licenses/validate', payload)
    
    def activate(
        self,
        license_key: str,
        machine_id: str,
        hostname: Optional[str] = None
    ) -> dict:
        return self._request('POST', '/api/v1/licenses/activate', {
            'license_key': license_key,
            'machine_id': machine_id,
            'hostname': hostname,
        })
    
    def deactivate(self, license_key: str, machine_id: str) -> dict:
        return self._request('POST', '/api/v1/licenses/deactivate', {
            'license_key': license_key,
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


# Usage Example
lg = LicenseGuard('your_api_key_here')

try:
    result = lg.validate(
        'LG-XXXX-XXXX-XXXX-XXXX',
        'your-product-slug',
        socket.gethostname()
    )
    
    if result['valid']:
        print(f"License valid! Type: {result['license']['type']}")
        print(f"Expires: {result['license']['expires_at']}")
except Exception as e:
    print(f"Error: {e}")`;

const curlCode = `# Validate a license
curl -X POST ${baseUrl}/api/v1/licenses/validate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your_api_key_here" \\
  -d '{
    "license_key": "LG-XXXX-XXXX-XXXX-XXXX",
    "product_id": "your-product-slug",
    "machine_id": "my-machine-001"
  }'

# Activate a license
curl -X POST ${baseUrl}/api/v1/licenses/activate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your_api_key_here" \\
  -d '{
    "license_key": "LG-XXXX-XXXX-XXXX-XXXX",
    "machine_id": "my-machine-001",
    "hostname": "workstation-1"
  }'

# Deactivate a license
curl -X POST ${baseUrl}/api/v1/licenses/deactivate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your_api_key_here" \\
  -d '{
    "license_key": "LG-XXXX-XXXX-XXXX-XXXX",
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
