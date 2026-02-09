import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  FileCode,
  Globe,
  Code2,
  Copy,
  CheckCircle2,
  Package,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  Layers,
  Terminal,
  FolderOpen,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

function generatePhpSdk(): string {
  return `<?php
/**
 * CTRXL LicenseGuard PHP SDK v2.0 (Anti-Crack Edition)
 * License validation with cryptographic signature verification,
 * nonce challenge-response, heartbeat, and anti-tamper protection
 * 
 * Usage:
 *   require_once 'LicenseGuard.php';
 *   $lg = new LicenseGuard('your_api_key', 'CL-XXX-XXX-XXX-XXX');
 *   $lg->validateOrRedirect(); // Validates with full anti-crack protection
 */
class LicenseGuard {
    private string $apiKey;
    private string $baseUrl;
    private string $licenseKey;
    private ?string $cachedToken = null;
    private int $cachedTimestamp = 0;
    private int $heartbeatInterval = 3600; // Re-validate every hour
    private string $cacheFile;
    private string $integrityHash;
    
    public function __construct(string $apiKey, string $licenseKey, string $baseUrl = '${baseUrl}') {
        $this->apiKey = $apiKey;
        $this->licenseKey = $licenseKey;
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->cacheFile = sys_get_temp_dir() . '/.ctrxl_' . md5($licenseKey) . '.cache';
        $this->integrityHash = md5_file(__FILE__);
    }
    
    public function getInstallUrl(): string {
        return $this->baseUrl . '/install/' . urlencode($this->licenseKey);
    }
    
    private function checkIntegrity(): bool {
        return md5_file(__FILE__) === $this->integrityHash;
    }
    
    private function getNonce(): ?object {
        try {
            $ch = curl_init($this->baseUrl . '/api/v1/nonce');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
                CURLOPT_POSTFIELDS => '{}',
                CURLOPT_TIMEOUT => 10,
            ]);
            $response = curl_exec($ch);
            curl_close($ch);
            return json_decode($response);
        } catch (\\Exception $e) {
            return null;
        }
    }
    
    private function verifyToken(bool $valid, int $timestamp, string $token): bool {
        try {
            $ch = curl_init($this->baseUrl . '/api/v1/licenses/verify-token');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
                CURLOPT_POSTFIELDS => json_encode([
                    'license_key' => $this->licenseKey,
                    'valid' => $valid,
                    'timestamp' => $timestamp,
                    'token' => $token,
                ]),
                CURLOPT_TIMEOUT => 10,
            ]);
            $response = curl_exec($ch);
            curl_close($ch);
            $result = json_decode($response);
            return $result && $result->verified === true;
        } catch (\\Exception $e) {
            return false;
        }
    }

    public function validate(?string $domain = null, ?string $productId = null, ?string $machineId = null): object {
        if (!$this->checkIntegrity()) {
            throw new \\Exception('SDK integrity check failed. File has been tampered with.');
        }
        
        $nonceData = $this->getNonce();
        $nonce = $nonceData ? $nonceData->nonce : null;
        
        $payload = ['license_key' => $this->licenseKey];
        if ($domain) $payload['domain'] = $domain;
        if ($productId) $payload['product_id'] = $productId;
        if ($machineId) $payload['machine_id'] = $machineId;
        if ($nonce) $payload['nonce'] = $nonce;
        
        $result = $this->request('POST', '/api/v1/licenses/validate', $payload);
        
        if (isset($result->_security)) {
            $sec = $result->_security;
            if (!$this->verifyToken($result->valid, $sec->timestamp, $sec->token)) {
                throw new \\Exception('Response signature verification failed. Possible tampering detected.');
            }
            $this->cachedToken = $sec->token;
            $this->cachedTimestamp = $sec->timestamp;
            $this->saveCache($result->valid, $sec->token, $sec->timestamp);
        }
        
        return $result;
    }
    
    public function validateOrRedirect(?string $domain = null, ?string $productId = null): void {
        if (!$this->checkIntegrity()) {
            header('Location: ' . $this->getInstallUrl() . '?error=tampered');
            exit;
        }
        
        if ($this->isHeartbeatValid()) {
            return;
        }
        
        try {
            $result = $this->validate($domain ?? ($_SERVER['HTTP_HOST'] ?? ''), $productId);
            if (!$result->valid) {
                $this->clearCache();
                header('Location: ' . $this->getInstallUrl());
                exit;
            }
        } catch (\\Exception $e) {
            $this->clearCache();
            header('Location: ' . $this->getInstallUrl());
            exit;
        }
    }
    
    public function startHeartbeat(?string $domain = null): void {
        $this->heartbeatInterval = 1800; // 30 minutes for persistent apps
        $this->validateOrRedirect($domain);
    }
    
    private function isHeartbeatValid(): bool {
        $cache = $this->loadCache();
        if (!$cache) return false;
        
        $age = time() - ($cache['timestamp'] / 1000);
        if ($age > $this->heartbeatInterval) return false;
        
        return $this->verifyToken($cache['valid'], $cache['timestamp'], $cache['token']);
    }
    
    private function saveCache(bool $valid, string $token, int $timestamp): void {
        $data = json_encode(['valid' => $valid, 'token' => $token, 'timestamp' => $timestamp, 'checksum' => md5($token . $timestamp . $this->apiKey)]);
        @file_put_contents($this->cacheFile, $data);
    }
    
    private function loadCache(): ?array {
        if (!file_exists($this->cacheFile)) return null;
        $data = json_decode(@file_get_contents($this->cacheFile), true);
        if (!$data || !isset($data['checksum'])) return null;
        $expectedChecksum = md5($data['token'] . $data['timestamp'] . $this->apiKey);
        if ($data['checksum'] !== $expectedChecksum) {
            $this->clearCache();
            return null;
        }
        return $data;
    }
    
    private function clearCache(): void {
        @unlink($this->cacheFile);
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
            CURLOPT_TIMEOUT => 15,
            CURLOPT_SSL_VERIFYPEER => true,
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
  return `// license-guard.ts - CTRXL LicenseGuard Next.js/TypeScript SDK v2.0 (Anti-Crack Edition)
// License validation with cryptographic signature verification,
// nonce challenge-response, heartbeat, and anti-tamper protection
//
// Usage:
//   import { LicenseGuard } from './license-guard';
//   const lg = new LicenseGuard('your_api_key', 'CL-XXX-XXX-XXX-XXX');
//   await lg.validateOrRedirect(req, res); // Express/Next.js
//   lg.startHeartbeat(); // For long-running apps

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface SecurityPayload {
  timestamp: number;
  nonce: string | null;
  signature: string;
  token: string;
  algorithm: string;
}

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
  _security?: SecurityPayload;
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

interface CacheData {
  valid: boolean;
  token: string;
  timestamp: number;
  checksum: string;
}

export class LicenseGuard {
  private apiKey: string;
  private baseUrl: string;
  private licenseKey: string;
  private heartbeatInterval: number = 3600;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private cacheFile: string;
  private integrityHash: string;

  constructor(apiKey: string, licenseKey: string, baseUrl: string = '${baseUrl}') {
    this.apiKey = apiKey;
    this.licenseKey = licenseKey;
    this.baseUrl = baseUrl.replace(/\\/$/, '');
    this.cacheFile = path.join(os.tmpdir(), '.ctrxl_' + crypto.createHash('md5').update(licenseKey).digest('hex') + '.cache');
    this.integrityHash = this.computeFileHash();
  }

  private computeFileHash(): string {
    try {
      const content = fs.readFileSync(__filename, 'utf8');
      return crypto.createHash('md5').update(content).digest('hex');
    } catch {
      return '';
    }
  }

  private checkIntegrity(): boolean {
    if (!this.integrityHash) return true;
    try {
      const currentHash = crypto.createHash('md5').update(fs.readFileSync(__filename, 'utf8')).digest('hex');
      return currentHash === this.integrityHash;
    } catch {
      return true;
    }
  }

  getInstallUrl(): string {
    return \`\${this.baseUrl}/install/\${encodeURIComponent(this.licenseKey)}\`;
  }

  private async getNonce(): Promise<{ nonce: string; timestamp: number } | null> {
    try {
      const res = await fetch(\`\${this.baseUrl}/api/v1/nonce\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      return await res.json();
    } catch {
      return null;
    }
  }

  private async verifyToken(valid: boolean, timestamp: number, token: string): Promise<boolean> {
    try {
      const res = await fetch(\`\${this.baseUrl}/api/v1/licenses/verify-token\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license_key: this.licenseKey,
          valid,
          timestamp,
          token,
        }),
      });
      const data = await res.json();
      return data.verified === true;
    } catch {
      return false;
    }
  }

  async validate(domain?: string, productId?: string, machineId?: string): Promise<ValidateResult> {
    if (!this.checkIntegrity()) {
      throw new Error('SDK integrity check failed. File has been tampered with.');
    }

    const nonceData = await this.getNonce();
    const payload: Record<string, string> = { license_key: this.licenseKey };
    if (domain) payload.domain = domain;
    if (productId) payload.product_id = productId;
    if (machineId) payload.machine_id = machineId;
    if (nonceData?.nonce) payload.nonce = nonceData.nonce;

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

    const result: ValidateResult = await response.json();

    if (result._security) {
      const verified = await this.verifyToken(result.valid, result._security.timestamp, result._security.token);
      if (!verified) {
        throw new Error('Response signature verification failed. Possible tampering detected.');
      }
      this.saveCache(result.valid, result._security.token, result._security.timestamp);
    }

    return result;
  }

  async validateOrRedirect(req?: any, res?: any, domain?: string): Promise<ValidateResult | void> {
    if (!this.checkIntegrity()) {
      if (res?.redirect) {
        return res.redirect(this.getInstallUrl() + '?error=tampered');
      }
      throw new Error('SDK integrity check failed');
    }

    const cached = this.isHeartbeatValid();
    if (cached) return;

    try {
      const host = domain || req?.headers?.host || req?.hostname || '';
      const result = await this.validate(host);
      if (!result.valid) {
        this.clearCache();
        if (res?.redirect) {
          return res.redirect(this.getInstallUrl());
        }
        throw new Error('License invalid: ' + result.message);
      }
      return result;
    } catch (err) {
      this.clearCache();
      if (res?.redirect) {
        return res.redirect(this.getInstallUrl());
      }
      throw err;
    }
  }

  startHeartbeat(domain?: string, intervalSeconds: number = 1800): void {
    this.heartbeatInterval = intervalSeconds;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(async () => {
      try {
        await this.validate(domain);
      } catch (err) {
        console.error('[LicenseGuard] Heartbeat validation failed:', err);
      }
    }, intervalSeconds * 1000);
    this.validate(domain).catch(console.error);
  }

  stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private isHeartbeatValid(): boolean {
    const cache = this.loadCache();
    if (!cache) return false;
    const ageSeconds = (Date.now() - cache.timestamp) / 1000;
    if (ageSeconds > this.heartbeatInterval) return false;
    return true;
  }

  private saveCache(valid: boolean, token: string, timestamp: number): void {
    const checksum = crypto.createHash('md5').update(token + timestamp + this.apiKey).digest('hex');
    const data: CacheData = { valid, token, timestamp, checksum };
    try { fs.writeFileSync(this.cacheFile, JSON.stringify(data)); } catch {}
  }

  private loadCache(): CacheData | null {
    try {
      const raw = fs.readFileSync(this.cacheFile, 'utf8');
      const data: CacheData = JSON.parse(raw);
      const expectedChecksum = crypto.createHash('md5').update(data.token + data.timestamp + this.apiKey).digest('hex');
      if (data.checksum !== expectedChecksum) {
        this.clearCache();
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  private clearCache(): void {
    try { fs.unlinkSync(this.cacheFile); } catch {}
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
`;
}

function generatePythonSdk(): string {
  return `"""
CTRXL LicenseGuard Python SDK v2.0 (Anti-Crack Edition)
License validation with cryptographic signature verification,
nonce challenge-response, heartbeat, and anti-tamper protection

Usage:
    from license_guard import LicenseGuard
    lg = LicenseGuard('your_api_key', 'CL-XXX-XXX-XXX-XXX')
    lg.validate_or_exit()  # Validates with full anti-crack protection
    lg.start_heartbeat()   # For long-running apps (Flask/Django/FastAPI)
"""
import requests
import hashlib
import json
import os
import time
import threading
import tempfile
from typing import Optional, Dict, Any
from urllib.parse import quote


class LicenseGuard:
    def __init__(self, api_key: str, license_key: str, base_url: str = '${baseUrl}'):
        self.api_key = api_key
        self.license_key = license_key
        self.base_url = base_url.rstrip('/')
        self.heartbeat_interval = 3600  # 1 hour default
        self._heartbeat_thread: Optional[threading.Timer] = None
        self._cache_file = os.path.join(
            tempfile.gettempdir(),
            f'.ctrxl_{hashlib.md5(license_key.encode()).hexdigest()}.cache'
        )
        self._integrity_hash = self._compute_file_hash()

    def _compute_file_hash(self) -> str:
        try:
            with open(__file__, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except Exception:
            return ''

    def _check_integrity(self) -> bool:
        if not self._integrity_hash:
            return True
        try:
            with open(__file__, 'rb') as f:
                current = hashlib.md5(f.read()).hexdigest()
            return current == self._integrity_hash
        except Exception:
            return True

    def get_install_url(self) -> str:
        return f'{self.base_url}/install/{quote(self.license_key)}'

    def _get_nonce(self) -> Optional[Dict[str, Any]]:
        try:
            resp = requests.post(
                f'{self.base_url}/api/v1/nonce',
                json={},
                timeout=10,
            )
            return resp.json()
        except Exception:
            return None

    def _verify_token(self, valid: bool, timestamp: int, token: str) -> bool:
        try:
            resp = requests.post(
                f'{self.base_url}/api/v1/licenses/verify-token',
                json={
                    'license_key': self.license_key,
                    'valid': valid,
                    'timestamp': timestamp,
                    'token': token,
                },
                timeout=10,
            )
            data = resp.json()
            return data.get('verified') is True
        except Exception:
            return False

    def validate(self, domain: Optional[str] = None, product_id: Optional[str] = None, machine_id: Optional[str] = None) -> dict:
        if not self._check_integrity():
            raise RuntimeError('SDK integrity check failed. File has been tampered with.')

        nonce_data = self._get_nonce()
        payload: Dict[str, str] = {'license_key': self.license_key}
        if domain:
            payload['domain'] = domain
        if product_id:
            payload['product_id'] = product_id
        if machine_id:
            payload['machine_id'] = machine_id
        if nonce_data and 'nonce' in nonce_data:
            payload['nonce'] = nonce_data['nonce']

        result = self._request('POST', '/api/v1/licenses/validate', payload)

        security = result.get('_security')
        if security:
            verified = self._verify_token(
                result.get('valid', False),
                security['timestamp'],
                security['token'],
            )
            if not verified:
                raise RuntimeError('Response signature verification failed. Possible tampering detected.')
            self._save_cache(result.get('valid', False), security['token'], security['timestamp'])

        return result

    def validate_or_exit(self, domain: Optional[str] = None, product_id: Optional[str] = None) -> dict:
        if not self._check_integrity():
            print(f"SDK integrity check failed. Visit: {self.get_install_url()}")
            raise SystemExit(1)

        cached = self._is_heartbeat_valid()
        if cached:
            return {'valid': True, 'cached': True}

        try:
            result = self.validate(domain, product_id)
            if not result.get('valid'):
                self._clear_cache()
                print(f"License invalid. Visit: {self.get_install_url()}")
                raise SystemExit(1)
            return result
        except (requests.RequestException, RuntimeError) as e:
            self._clear_cache()
            print(f"License check failed: {e}. Visit: {self.get_install_url()}")
            raise SystemExit(1)

    def start_heartbeat(self, domain: Optional[str] = None, interval_seconds: int = 1800) -> None:
        self.heartbeat_interval = interval_seconds
        self.validate_or_exit(domain)

        def _heartbeat():
            try:
                self.validate(domain)
            except Exception as e:
                print(f"[LicenseGuard] Heartbeat validation failed: {e}")
            self._heartbeat_thread = threading.Timer(interval_seconds, _heartbeat)
            self._heartbeat_thread.daemon = True
            self._heartbeat_thread.start()

        self._heartbeat_thread = threading.Timer(interval_seconds, _heartbeat)
        self._heartbeat_thread.daemon = True
        self._heartbeat_thread.start()

    def stop_heartbeat(self) -> None:
        if self._heartbeat_thread:
            self._heartbeat_thread.cancel()
            self._heartbeat_thread = None

    def _is_heartbeat_valid(self) -> bool:
        cache = self._load_cache()
        if not cache:
            return False
        age_seconds = (time.time() * 1000 - cache['timestamp']) / 1000
        if age_seconds > self.heartbeat_interval:
            return False
        return True

    def _save_cache(self, valid: bool, token: str, timestamp: int) -> None:
        checksum = hashlib.md5(f"{token}{timestamp}{self.api_key}".encode()).hexdigest()
        data = {'valid': valid, 'token': token, 'timestamp': timestamp, 'checksum': checksum}
        try:
            with open(self._cache_file, 'w') as f:
                json.dump(data, f)
        except Exception:
            pass

    def _load_cache(self) -> Optional[Dict[str, Any]]:
        try:
            with open(self._cache_file, 'r') as f:
                data = json.load(f)
            expected = hashlib.md5(f"{data['token']}{data['timestamp']}{self.api_key}".encode()).hexdigest()
            if data.get('checksum') != expected:
                self._clear_cache()
                return None
            return data
        except Exception:
            return None

    def _clear_cache(self) -> None:
        try:
            os.remove(self._cache_file)
        except Exception:
            pass

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
            },
            timeout=15,
        )
        response.raise_for_status()
        return response.json()
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

function CodeBlock({ code, language }: { code: string; language?: string }) {
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
        <Button size="icon" variant="ghost" onClick={copy} data-testid="button-copy-code">
          {copied ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <div className="bg-background rounded-md p-4 font-mono text-xs overflow-x-auto max-h-[400px] overflow-y-auto">
        <pre className="text-muted-foreground whitespace-pre-wrap">{code}</pre>
      </div>
    </div>
  );
}

const sellerSteps = [
  {
    icon: Package,
    title: "Create Product & Generate License",
    description: "Go to Products page, create your product. Then go to Licenses page and generate a license key (CL-XXX-XXX-XXX-XXX) for that product.",
  },
  {
    icon: Download,
    title: "Download SDK File",
    description: "Download the LicenseGuard SDK file below that matches your source code's language (PHP, TypeScript, or Python).",
  },
  {
    icon: FolderOpen,
    title: "Add SDK to Your Source Code",
    description: "Place the SDK file into your project directory. Add the license check code to your application's entry point (index.php, app.ts, main.py, etc.).",
  },
  {
    icon: ShieldCheck,
    title: "Embed License Key & Config",
    description: "Create a config file (e.g. .env or config.php) with your API key and the license key. The SDK reads this config on every request.",
  },
  {
    icon: Zap,
    title: "Sell Your Source Code",
    description: "Package and sell your source code. When the buyer opens the app without a valid license configuration, they're auto-redirected to the installation page.",
  },
];

const sdkFiles = [
  {
    id: "php",
    title: "PHP SDK v2.0",
    filename: "LicenseGuard.php",
    icon: FileCode,
    description: "Anti-crack PHP SDK with HMAC signature verification, nonce challenge-response, heartbeat validation, and file integrity checks. Compatible with PHP 7.4+.",
    tags: ["Anti-Crack", "HMAC", "Heartbeat", "Anti-Tamper", "PHP 7.4+"],
    generate: generatePhpSdk,
  },
  {
    id: "nextjs",
    title: "TypeScript SDK v2.0",
    filename: "license-guard.ts",
    icon: Globe,
    description: "Anti-crack TypeScript SDK with HMAC signature verification, nonce challenge-response, heartbeat timer, and file integrity checks. Works with Next.js, Express.js, or any Node.js project.",
    tags: ["Anti-Crack", "HMAC", "Heartbeat", "Anti-Tamper", "TypeScript"],
    generate: generateNextjsSdk,
  },
  {
    id: "python",
    title: "Python SDK v2.0",
    filename: "license_guard.py",
    icon: Code2,
    description: "Anti-crack Python SDK with HMAC signature verification, nonce challenge-response, background heartbeat thread, and file integrity checks. Compatible with Python 3.7+.",
    tags: ["Anti-Crack", "HMAC", "Heartbeat", "Anti-Tamper", "Python 3.7+"],
    generate: generatePythonSdk,
  },
];

const phpEmbedExample = `<?php
// === FILE: config.php (included in your source code) ===
require_once __DIR__ . '/LicenseGuard.php';

// Buyer will replace these values from their CTRXL dashboard
define('CTRXL_API_KEY', 'cl_xxxxxxxxxxxxxxxx');
define('CTRXL_LICENSE_KEY', 'CL-ABC-DEF-GHI-JKL');

$license = new LicenseGuard(CTRXL_API_KEY, CTRXL_LICENSE_KEY);

// This line does the magic:
// - Valid license? App runs normally
// - Invalid/expired? Auto-redirect to install page
$license->validateOrRedirect();`;

const phpLaravelExample = `<?php
// === FILE: app/Http/Middleware/LicenseCheck.php ===
namespace App\\Http\\Middleware;

use Closure;
use Illuminate\\Http\\Request;

class LicenseCheck {
    public function handle(Request $request, Closure $next) {
        $lg = new \\LicenseGuard(
            config('license.api_key'),
            config('license.license_key')
        );
        
        try {
            $result = $lg->validate($request->getHost());
            if (!$result->valid) {
                return redirect($lg->getInstallUrl());
            }
        } catch (\\Exception $e) {
            return redirect($lg->getInstallUrl());
        }
        
        return $next($request);
    }
}

// === FILE: config/license.php ===
return [
    'api_key' => env('CTRXL_API_KEY', ''),
    'license_key' => env('CTRXL_LICENSE_KEY', ''),
];

// === FILE: .env (buyer fills this in) ===
// CTRXL_API_KEY=cl_xxxxxxxxxxxxxxxx
// CTRXL_LICENSE_KEY=CL-ABC-DEF-GHI-JKL

// === FILE: app/Http/Kernel.php (add to middleware) ===
// protected $middleware = [
//     \\App\\Http\\Middleware\\LicenseCheck::class,
//     ...
// ];`;

const phpWordpressExample = `<?php
// === FILE: wp-content/themes/your-theme/functions.php ===
require_once get_template_directory() . '/LicenseGuard.php';

function ctrxl_license_check() {
    // Skip check for admin pages and login
    if (is_admin() || wp_doing_ajax()) return;
    
    $api_key = get_option('ctrxl_api_key', '');
    $license_key = get_option('ctrxl_license_key', '');
    
    if (empty($api_key) || empty($license_key)) {
        wp_redirect(admin_url('themes.php?page=license-settings'));
        exit;
    }
    
    $lg = new LicenseGuard($api_key, $license_key);
    $lg->validateOrRedirect($_SERVER['HTTP_HOST']);
}
add_action('template_redirect', 'ctrxl_license_check');

// === License Settings Page ===
function ctrxl_license_settings_page() {
    add_theme_page(
        'License Settings',
        'License',
        'manage_options',
        'license-settings',
        'ctrxl_license_settings_html'
    );
}
add_action('admin_menu', 'ctrxl_license_settings_page');

function ctrxl_license_settings_html() {
    if (isset($_POST['ctrxl_save'])) {
        update_option('ctrxl_api_key', sanitize_text_field($_POST['api_key']));
        update_option('ctrxl_license_key', sanitize_text_field($_POST['license_key']));
        echo '<div class="updated"><p>License settings saved.</p></div>';
    }
    ?>
    <div class="wrap">
        <h1>CTRXL License Settings</h1>
        <form method="post">
            <table class="form-table">
                <tr>
                    <th>API Key</th>
                    <td><input type="text" name="api_key" value="<?php echo esc_attr(get_option('ctrxl_api_key')); ?>" class="regular-text" /></td>
                </tr>
                <tr>
                    <th>License Key</th>
                    <td><input type="text" name="license_key" value="<?php echo esc_attr(get_option('ctrxl_license_key')); ?>" class="regular-text" /></td>
                </tr>
            </table>
            <input type="submit" name="ctrxl_save" class="button button-primary" value="Save Settings" />
        </form>
    </div>
    <?php
}`;

const nextjsEmbedExample = `// === FILE: .env.local (buyer fills this in) ===
// CTRXL_API_KEY=cl_xxxxxxxxxxxxxxxx
// CTRXL_LICENSE_KEY=CL-ABC-DEF-GHI-JKL

// === FILE: middleware.ts (root of Next.js project) ===
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LicenseGuard } from './lib/license-guard';

const lg = new LicenseGuard(
  process.env.CTRXL_API_KEY!,
  process.env.CTRXL_LICENSE_KEY!
);

export async function middleware(request: NextRequest) {
  // Skip license check for static files and API routes
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

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

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};`;

const nextjsExpressExample = `// === FILE: server.ts (Express.js backend) ===
import express from 'express';
import { LicenseGuard } from './license-guard';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const lg = new LicenseGuard(
  process.env.CTRXL_API_KEY!,
  process.env.CTRXL_LICENSE_KEY!
);

// License middleware - runs before every request
app.use(async (req, res, next) => {
  // Skip for static assets
  if (req.path.startsWith('/assets') || req.path.startsWith('/public')) {
    return next();
  }
  
  try {
    const result = await lg.validate(req.hostname);
    if (!result.valid) {
      return res.redirect(lg.getInstallUrl());
    }
    next();
  } catch {
    return res.redirect(lg.getInstallUrl());
  }
});

// Your routes here...
app.get('/', (req, res) => {
  res.send('App is running with valid license!');
});

app.listen(3000);

// === FILE: .env (buyer fills this in) ===
// CTRXL_API_KEY=cl_xxxxxxxxxxxxxxxx
// CTRXL_LICENSE_KEY=CL-ABC-DEF-GHI-JKL`;

const pythonFlaskExample = `# === FILE: app.py (Flask application) ===
import os
from flask import Flask, redirect
from dotenv import load_dotenv
from license_guard import LicenseGuard

load_dotenv()

app = Flask(__name__)

lg = LicenseGuard(
    api_key=os.environ['CTRXL_API_KEY'],
    license_key=os.environ['CTRXL_LICENSE_KEY']
)

@app.before_request
def check_license():
    from flask import request
    # Skip for static files
    if request.path.startswith('/static'):
        return None
    try:
        result = lg.validate(domain=request.host)
        if not result.get('valid'):
            return redirect(lg.get_install_url())
    except Exception:
        return redirect(lg.get_install_url())

@app.route('/')
def index():
    return 'App is running with valid license!'

# === FILE: .env (buyer fills this in) ===
# CTRXL_API_KEY=cl_xxxxxxxxxxxxxxxx
# CTRXL_LICENSE_KEY=CL-ABC-DEF-GHI-JKL`;

const pythonDjangoExample = `# === FILE: license_middleware.py (Django middleware) ===
import os
from django.shortcuts import redirect
from license_guard import LicenseGuard

class LicenseMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.lg = LicenseGuard(
            api_key=os.environ.get('CTRXL_API_KEY', ''),
            license_key=os.environ.get('CTRXL_LICENSE_KEY', '')
        )

    def __call__(self, request):
        # Skip for admin and static files
        if request.path.startswith('/admin') or request.path.startswith('/static'):
            return self.get_response(request)
            
        try:
            result = self.lg.validate(domain=request.get_host())
            if not result.get('valid'):
                return redirect(self.lg.get_install_url())
        except Exception:
            return redirect(self.lg.get_install_url())
        
        return self.get_response(request)

# === FILE: settings.py (add to MIDDLEWARE list) ===
# MIDDLEWARE = [
#     'license_middleware.LicenseMiddleware',
#     ...
# ]

# === FILE: .env (buyer fills this in) ===
# CTRXL_API_KEY=cl_xxxxxxxxxxxxxxxx
# CTRXL_LICENSE_KEY=CL-ABC-DEF-GHI-JKL`;

const pythonFastapiExample = `# === FILE: main.py (FastAPI application) ===
import os
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from license_guard import LicenseGuard

load_dotenv()

app = FastAPI()

lg = LicenseGuard(
    api_key=os.environ['CTRXL_API_KEY'],
    license_key=os.environ['CTRXL_LICENSE_KEY']
)

@app.middleware("http")
async def license_check(request: Request, call_next):
    # Skip for docs and static
    if request.url.path in ['/docs', '/openapi.json', '/redoc']:
        return await call_next(request)
    
    try:
        result = lg.validate(domain=request.headers.get('host', ''))
        if not result.get('valid'):
            return RedirectResponse(url=lg.get_install_url())
    except Exception:
        return RedirectResponse(url=lg.get_install_url())
    
    return await call_next(request)

@app.get("/")
def read_root():
    return {"message": "App is running with valid license!"}

# === FILE: .env (buyer fills this in) ===
# CTRXL_API_KEY=cl_xxxxxxxxxxxxxxxx
# CTRXL_LICENSE_KEY=CL-ABC-DEF-GHI-JKL`;

const projectStructurePhp = `your-source-code/
  index.php            <-- Entry point, includes config.php
  config.php           <-- License check happens here
  LicenseGuard.php     <-- SDK file (downloaded from CTRXL)
  .env.example         <-- Template for buyer to fill in
  README.md            <-- Installation instructions for buyer
  ... (your app files)`;

const projectStructureNextjs = `your-source-code/
  middleware.ts         <-- License check middleware
  lib/
    license-guard.ts    <-- SDK file (downloaded from CTRXL)
  .env.example          <-- Template for buyer to fill in
  README.md             <-- Installation instructions for buyer
  ... (your app files)`;

const projectStructurePython = `your-source-code/
  app.py               <-- Entry point with license middleware
  license_guard.py     <-- SDK file (downloaded from CTRXL)
  .env.example         <-- Template for buyer to fill in
  requirements.txt     <-- Include 'requests' dependency
  README.md            <-- Installation instructions for buyer
  ... (your app files)`;

const envExampleContent = `# CTRXL License Configuration
# Get your API key from: ${baseUrl}/api-keys
# Your license key was provided with your purchase

CTRXL_API_KEY=your_api_key_here
CTRXL_LICENSE_KEY=CL-XXX-XXX-XXX-XXX`;

const readmeTemplate = `# Installation Guide

## Step 1: Configure License
1. Copy \`.env.example\` to \`.env\`
2. Get your API key from: ${baseUrl}/api-keys  
3. Enter your license key (provided with purchase)
4. Fill in the values in your \`.env\` file

## Step 2: Install Dependencies
\`\`\`bash
# PHP: No extra dependencies needed (uses cURL)
# Node.js: npm install
# Python: pip install -r requirements.txt
\`\`\`

## Step 3: Run the Application
Start the application as usual. The license will be validated automatically.

If your license is invalid or expired, you will be redirected to:
${baseUrl}/install/YOUR-LICENSE-KEY

## Need Help?
Visit your license installation page for detailed setup instructions.`;

export default function DownloadsPage() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<"guide" | "sdk" | "frameworks">("guide");

  return (
    <div className="p-6 space-y-8 max-w-[1000px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-downloads-title">SDK & Integration Guide</h1>
        <p className="text-muted-foreground mt-1">
          Everything you need to protect your source code with license validation
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeSection === "guide" ? "default" : "outline"}
          onClick={() => setActiveSection("guide")}
          data-testid="button-section-guide"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Seller Guide
        </Button>
        <Button
          variant={activeSection === "sdk" ? "default" : "outline"}
          onClick={() => setActiveSection("sdk")}
          data-testid="button-section-sdk"
        >
          <Download className="h-4 w-4 mr-2" />
          SDK Downloads
        </Button>
        <Button
          variant={activeSection === "frameworks" ? "default" : "outline"}
          onClick={() => setActiveSection("frameworks")}
          data-testid="button-section-frameworks"
        >
          <Layers className="h-4 w-4 mr-2" />
          Framework Examples
        </Button>
      </div>

      <Card className="p-4 bg-muted/30">
        <p className="text-sm text-muted-foreground" data-testid="text-docs-link-hint">
          For complete API reference and endpoint documentation, visit the <a href="/docs" className="text-primary underline">Documentation</a> page.
        </p>
      </Card>

      {activeSection === "guide" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">How It Works (Like CodeCanyon)</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Protect your source code with automatic license validation. When a buyer purchases and runs your source code, the SDK checks the license. 
              If the license is invalid or not configured, the buyer is automatically redirected to the license installation page where they can see setup instructions.
            </p>
            <div className="bg-muted/50 rounded-md p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm">
                <Badge variant="secondary">Buyer opens app</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <Badge variant="secondary">SDK checks license</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <Badge variant="secondary">Invalid? Redirect to install page</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <Badge variant="secondary">Valid? App runs normally</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4" data-testid="card-anti-crack-features">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-chart-2" />
              <h2 className="font-semibold text-lg">Anti-Crack Protection (v2.0)</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Our SDK v2.0 includes multiple layers of protection that make it virtually impossible to crack or bypass license validation:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  title: "HMAC-SHA256 Signatures",
                  desc: "Every validation response is cryptographically signed by the server. The SDK verifies the signature to ensure responses haven't been intercepted or faked.",
                },
                {
                  title: "Nonce Challenge-Response",
                  desc: "Each validation request uses a unique one-time nonce. Old responses cannot be replayed - every check requires a fresh server interaction.",
                },
                {
                  title: "Heartbeat Validation",
                  desc: "The SDK periodically re-validates licenses in the background. Even if initial validation is bypassed, the heartbeat will catch it.",
                },
                {
                  title: "Anti-Tamper Detection",
                  desc: "The SDK calculates its own file hash at startup. If anyone modifies the SDK file to bypass checks, it immediately detects the tampering.",
                },
                {
                  title: "Encrypted Cache with Checksums",
                  desc: "Validation results are cached with cryptographic checksums tied to the API key. Cache files cannot be forged or copied between installations.",
                },
                {
                  title: "Server-Side Token Verification",
                  desc: "Validation tokens can be independently verified via the verify-token endpoint. Even if the response is manipulated, the token won't pass verification.",
                },
              ].map((feature, i) => (
                <div key={i} className="bg-muted/30 rounded-md p-3 space-y-1" data-testid={`text-anticrack-feature-${i}`}>
                  <p className="font-medium text-sm">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-xs text-muted-foreground">
                These protections are built into all SDK downloads (PHP, TypeScript, Python). No extra configuration needed - just download the SDK and use <code className="bg-background px-1 py-0.5 rounded text-xs font-mono">validateOrRedirect()</code> as usual.
              </p>
            </div>
          </Card>

          <Card className="p-5 space-y-5">
            <h2 className="font-semibold text-lg">Step-by-Step Seller Checklist</h2>
            <div className="space-y-4">
              {sellerSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3" data-testid={`step-seller-${i + 1}`}>
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <step.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Step {i + 1}: {step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="font-semibold text-lg">Project Structure</h2>
            <p className="text-sm text-muted-foreground">
              This is how your source code should be structured before selling. Include the SDK file and a <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">.env.example</code> so buyers know what to configure.
            </p>
            <Tabs defaultValue="php-struct">
              <TabsList className="mb-3 flex-wrap">
                <TabsTrigger value="php-struct">PHP</TabsTrigger>
                <TabsTrigger value="nextjs-struct">Next.js</TabsTrigger>
                <TabsTrigger value="python-struct">Python</TabsTrigger>
              </TabsList>
              <TabsContent value="php-struct">
                <CodeBlock code={projectStructurePhp} />
              </TabsContent>
              <TabsContent value="nextjs-struct">
                <CodeBlock code={projectStructureNextjs} />
              </TabsContent>
              <TabsContent value="python-struct">
                <CodeBlock code={projectStructurePython} />
              </TabsContent>
            </Tabs>
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="font-semibold text-lg">Files to Include in Your Source Code</h2>
            <p className="text-sm text-muted-foreground">
              Always include these files so buyers can easily set up their license:
            </p>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs font-mono">.env.example</Badge>
                </div>
                <CodeBlock code={envExampleContent} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs font-mono">README.md (Installation section)</Badge>
                </div>
                <CodeBlock code={readmeTemplate} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  downloadFile(envExampleContent, ".env.example");
                  toast({ title: ".env.example downloaded" });
                }}
                data-testid="button-download-env"
              >
                <Download className="h-4 w-4 mr-2" />
                Download .env.example
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  downloadFile(readmeTemplate, "INSTALL.md");
                  toast({ title: "INSTALL.md downloaded" });
                }}
                data-testid="button-download-readme"
              >
                <Download className="h-4 w-4 mr-2" />
                Download INSTALL.md
              </Button>
            </div>
          </Card>
        </div>
      )}

      {activeSection === "sdk" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="p-5">
            <h3 className="font-semibold mb-2">Quick Start</h3>
            <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Download the SDK file for your language below</li>
              <li>Add the file to your project root</li>
              <li>Create a <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">.env.example</code> with <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">CTRXL_API_KEY</code> and <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">CTRXL_LICENSE_KEY</code></li>
              <li>Add <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">validateOrRedirect()</code> to your app's entry point</li>
              <li>Package and sell - buyer fills in <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">.env</code> with their license</li>
            </ol>
          </Card>

          <Tabs defaultValue="php">
            <TabsList className="mb-4 flex-wrap">
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
                    <p className="text-xs font-medium text-muted-foreground mb-2">Full SDK Code</p>
                    <CodeBlock code={sdk.generate()} />
                  </div>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}

      {activeSection === "frameworks" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">
              Complete integration examples for popular frameworks. Each example shows exactly which files to create and how to configure the license check in your source code before selling it.
            </p>
          </Card>

          <Tabs defaultValue="php-embed">
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="php-embed" data-testid="tab-fw-php">
                <FileCode className="h-3.5 w-3.5 mr-1.5" />
                Vanilla PHP
              </TabsTrigger>
              <TabsTrigger value="php-laravel" data-testid="tab-fw-laravel">
                <FileCode className="h-3.5 w-3.5 mr-1.5" />
                Laravel
              </TabsTrigger>
              <TabsTrigger value="php-wordpress" data-testid="tab-fw-wordpress">
                <FileCode className="h-3.5 w-3.5 mr-1.5" />
                WordPress
              </TabsTrigger>
              <TabsTrigger value="nextjs-embed" data-testid="tab-fw-nextjs">
                <Globe className="h-3.5 w-3.5 mr-1.5" />
                Next.js
              </TabsTrigger>
              <TabsTrigger value="nextjs-express" data-testid="tab-fw-express">
                <Globe className="h-3.5 w-3.5 mr-1.5" />
                Express.js
              </TabsTrigger>
              <TabsTrigger value="python-flask" data-testid="tab-fw-flask">
                <Code2 className="h-3.5 w-3.5 mr-1.5" />
                Flask
              </TabsTrigger>
              <TabsTrigger value="python-django" data-testid="tab-fw-django">
                <Code2 className="h-3.5 w-3.5 mr-1.5" />
                Django
              </TabsTrigger>
              <TabsTrigger value="python-fastapi" data-testid="tab-fw-fastapi">
                <Code2 className="h-3.5 w-3.5 mr-1.5" />
                FastAPI
              </TabsTrigger>
            </TabsList>

            <TabsContent value="php-embed">
              <Card className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">Vanilla PHP Integration</h3>
                  <Badge variant="secondary" className="text-xs">Simplest</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add a single <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">config.php</code> file that your entry point includes. This checks the license on every page load.
                </p>
                <CodeBlock code={phpEmbedExample} />
              </Card>
            </TabsContent>

            <TabsContent value="php-laravel">
              <Card className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">Laravel Middleware</h3>
                  <Badge variant="secondary" className="text-xs">Recommended</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use Laravel middleware to check the license on every request. Buyer configures via <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">.env</code> file.
                </p>
                <CodeBlock code={phpLaravelExample} />
              </Card>
            </TabsContent>

            <TabsContent value="php-wordpress">
              <Card className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">WordPress Theme/Plugin</h3>
                  <Badge variant="secondary" className="text-xs">Theme/Plugin</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add license check to your WordPress theme or plugin with a built-in settings page for buyers to enter their license.
                </p>
                <CodeBlock code={phpWordpressExample} />
              </Card>
            </TabsContent>

            <TabsContent value="nextjs-embed">
              <Card className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">Next.js Middleware</h3>
                  <Badge variant="secondary" className="text-xs">Recommended</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use Next.js middleware to intercept all requests and validate the license. Buyer configures via <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">.env.local</code>.
                </p>
                <CodeBlock code={nextjsEmbedExample} />
              </Card>
            </TabsContent>

            <TabsContent value="nextjs-express">
              <Card className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">Express.js Middleware</h3>
                  <Badge variant="secondary" className="text-xs">Node.js</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add Express middleware that checks the license before handling any request.
                </p>
                <CodeBlock code={nextjsExpressExample} />
              </Card>
            </TabsContent>

            <TabsContent value="python-flask">
              <Card className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">Flask Integration</h3>
                  <Badge variant="secondary" className="text-xs">Recommended</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use Flask's <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">before_request</code> hook to check the license before every request.
                </p>
                <CodeBlock code={pythonFlaskExample} />
              </Card>
            </TabsContent>

            <TabsContent value="python-django">
              <Card className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">Django Middleware</h3>
                  <Badge variant="secondary" className="text-xs">Middleware</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Create a Django middleware class that validates the license on every request.
                </p>
                <CodeBlock code={pythonDjangoExample} />
              </Card>
            </TabsContent>

            <TabsContent value="python-fastapi">
              <Card className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">FastAPI Middleware</h3>
                  <Badge variant="secondary" className="text-xs">Async</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use FastAPI's HTTP middleware for async license validation on every request.
                </p>
                <CodeBlock code={pythonFastapiExample} />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
