import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileCode, Globe, Code2, Copy, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

function generatePhpSdk(): string {
  return `<?php
/**
 * CTRXL LicenseGuard PHP SDK v1.0
 * License validation, activation, and auto-redirect for PHP applications
 * 
 * Usage:
 *   require_once 'LicenseGuard.php';
 *   $lg = new LicenseGuard('your_api_key', 'CL-XXX-XXX-XXX-XXX');
 *   $lg->validateOrRedirect();
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
        $payload = ['license_key' => $this->licenseKey];
        if ($domain) $payload['domain'] = $domain;
        if ($productId) $payload['product_id'] = $productId;
        if ($machineId) $payload['machine_id'] = $machineId;
        return $this->request('POST', '/api/v1/licenses/validate', $payload);
    }
    
    public function validateOrRedirect(?string $domain = null, ?string $productId = null): void {
        try {
            $result = $this->validate($domain ?? ($_SERVER['HTTP_HOST'] ?? ''), $productId);
            if (!$result->valid) {
                header('Location: ' . $this->getInstallUrl());
                exit;
            }
        } catch (\\Exception $e) {
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
            throw new \\Exception("License API error: " . ($result->message ?? 'Unknown error'));
        }
        return $result;
    }
}
`;
}

function generateNextjsSdk(): string {
  return `// license-guard.ts - CTRXL LicenseGuard Next.js/TypeScript SDK v1.0
// License validation, activation, and auto-redirect for Next.js applications
//
// Usage:
//   import { LicenseGuard } from './license-guard';
//   const lg = new LicenseGuard('your_api_key', 'CL-XXX-XXX-XXX-XXX');

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

interface ActivateResult {
  success: boolean;
  activation?: {
    id: string;
    machine_id: string;
    activated_at: string;
  };
  message?: string;
}

export class LicenseGuard {
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
    const payload: Record<string, string> = { license_key: this.licenseKey };
    if (domain) payload.domain = domain;
    if (productId) payload.product_id = productId;
    if (machineId) payload.machine_id = machineId;

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

  async activate(machineId: string, hostname?: string): Promise<ActivateResult> {
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

  async deactivate(machineId: string): Promise<{ success: boolean; message: string }> {
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

// === Next.js Middleware Usage ===
// middleware.ts (root of your Next.js project)
//
// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import { LicenseGuard } from './license-guard';
//
// const lg = new LicenseGuard(
//   process.env.CTRXL_API_KEY!,
//   process.env.CTRXL_LICENSE_KEY!
// );
//
// export async function middleware(request: NextRequest) {
//   try {
//     const result = await lg.validate(request.headers.get('host') || '');
//     if (!result.valid) {
//       return NextResponse.redirect(lg.getInstallUrl());
//     }
//   } catch {
//     return NextResponse.redirect(lg.getInstallUrl());
//   }
//   return NextResponse.next();
// }
`;
}

function generatePythonSdk(): string {
  return `"""
CTRXL LicenseGuard Python SDK v1.0
License validation, activation, and auto-redirect for Python applications

Usage:
    from license_guard import LicenseGuard
    lg = LicenseGuard('your_api_key', 'CL-XXX-XXX-XXX-XXX')
    result = lg.validate()
"""
import requests
import socket
from typing import Optional
from urllib.parse import quote


class LicenseGuard:
    def __init__(self, api_key: str, license_key: str, base_url: str = '${baseUrl}'):
        self.api_key = api_key
        self.license_key = license_key
        self.base_url = base_url.rstrip('/')

    def get_install_url(self) -> str:
        return f'{self.base_url}/install/{quote(self.license_key)}'

    def validate(self, domain: Optional[str] = None, product_id: Optional[str] = None, machine_id: Optional[str] = None) -> dict:
        payload = {'license_key': self.license_key}
        if domain:
            payload['domain'] = domain
        if product_id:
            payload['product_id'] = product_id
        if machine_id:
            payload['machine_id'] = machine_id
        return self._request('POST', '/api/v1/licenses/validate', payload)

    def validate_or_exit(self, domain: Optional[str] = None, product_id: Optional[str] = None) -> dict:
        try:
            result = self.validate(domain, product_id)
            if not result.get('valid'):
                print(f"License invalid. Visit: {self.get_install_url()}")
                raise SystemExit(1)
            return result
        except requests.RequestException:
            print(f"License check failed. Visit: {self.get_install_url()}")
            raise SystemExit(1)

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


# === Flask Auto-Redirect Usage ===
#
# from flask import Flask, redirect
# from license_guard import LicenseGuard
#
# app = Flask(__name__)
# lg = LicenseGuard('your_api_key', 'CL-XXX-XXX-XXX-XXX')
#
# @app.before_request
# def check_license():
#     try:
#         result = lg.validate()
#         if not result.get('valid'):
#             return redirect(lg.get_install_url())
#     except Exception:
#         return redirect(lg.get_install_url())


# === Django Middleware Usage ===
#
# class LicenseMiddleware:
#     def __init__(self, get_response):
#         self.get_response = get_response
#         self.lg = LicenseGuard('your_api_key', 'CL-XXX-XXX-XXX-XXX')
#
#     def __call__(self, request):
#         try:
#             result = self.lg.validate(domain=request.get_host())
#             if not result.get('valid'):
#                 from django.shortcuts import redirect
#                 return redirect(self.lg.get_install_url())
#         except Exception:
#             from django.shortcuts import redirect
#             return redirect(self.lg.get_install_url())
#         return self.get_response(request)
`;
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function CodePreview({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const lines = code.split("\n").slice(0, 20).join("\n");

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Code copied to clipboard" });
  };

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 z-10">
        <Button
          size="icon"
          variant="ghost"
          onClick={copy}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          data-testid="button-copy-code"
        >
          {copied ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <div className="bg-background rounded-md p-4 font-mono text-xs overflow-x-auto max-h-[300px] overflow-y-auto">
        <pre className="text-muted-foreground whitespace-pre-wrap">{lines}{code.split("\n").length > 20 ? "\n\n// ... (download for full file)" : ""}</pre>
      </div>
    </div>
  );
}

const sdkFiles = [
  {
    id: "php",
    title: "PHP SDK",
    filename: "LicenseGuard.php",
    icon: FileCode,
    description: "Complete PHP class for license validation with auto-redirect support. Compatible with any PHP 7.4+ project, frameworks like Laravel, WordPress, or vanilla PHP.",
    tags: ["PHP 7.4+", "cURL", "Auto-Redirect"],
    generate: generatePhpSdk,
  },
  {
    id: "nextjs",
    title: "Next.js / TypeScript SDK",
    filename: "license-guard.ts",
    icon: Globe,
    description: "TypeScript SDK with full type definitions. Works with Next.js middleware for automatic redirect, or standalone in any Node.js/TypeScript project.",
    tags: ["TypeScript", "Next.js", "Node.js", "Middleware"],
    generate: generateNextjsSdk,
  },
  {
    id: "python",
    title: "Python SDK",
    filename: "license_guard.py",
    icon: Code2,
    description: "Python SDK with Flask and Django middleware examples. Compatible with Python 3.7+, supports auto-redirect and machine activation.",
    tags: ["Python 3.7+", "Flask", "Django", "Requests"],
    generate: generatePythonSdk,
  },
];

export default function DownloadsPage() {
  const { toast } = useToast();

  return (
    <div className="p-6 space-y-6 max-w-[1000px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-downloads-title">SDK Downloads</h1>
        <p className="text-muted-foreground mt-1">
          Download complete integration files for your preferred language
        </p>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-2">Quick Start</h3>
        <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
          <li>Download the SDK file for your language below</li>
          <li>Add the file to your project</li>
          <li>Replace <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">your_api_key</code> with your API key from the <a href="/api-keys" className="text-primary underline">API Keys</a> page</li>
          <li>Replace <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">CL-XXX-XXX-XXX-XXX</code> with your license key</li>
          <li>Call <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">validateOrRedirect()</code> to auto-redirect invalid licenses</li>
        </ol>
      </Card>

      <Tabs defaultValue="php">
        <TabsList className="mb-4">
          {sdkFiles.map((sdk) => (
            <TabsTrigger key={sdk.id} value={sdk.id} data-testid={`tab-download-${sdk.id}`}>
              <sdk.icon className="h-3.5 w-3.5 mr-1.5" />
              {sdk.id === "nextjs" ? "Next.js" : sdk.id.charAt(0).toUpperCase() + sdk.id.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        {sdkFiles.map((sdk) => (
          <TabsContent key={sdk.id} value={sdk.id}>
            <Card className="p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{sdk.title}</h3>
                  <p className="text-sm text-muted-foreground max-w-lg">{sdk.description}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {sdk.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => {
                    downloadFile(sdk.generate(), sdk.filename);
                    toast({ title: `${sdk.filename} downloaded` });
                  }}
                  data-testid={`button-download-${sdk.id}`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download {sdk.filename}
                </Button>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
                <CodePreview code={sdk.generate()} />
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
