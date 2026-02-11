import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated, authStorage } from "./replit_integrations/auth";
import { randomBytes, createHmac } from "crypto";
import bcrypt from "bcryptjs";

const LICENSE_SIGNING_SECRET = process.env.LICENSE_SIGNING_SECRET || (() => {
  const fallback = randomBytes(64).toString("hex");
  console.warn("[SECURITY] LICENSE_SIGNING_SECRET not set. Using random secret - tokens will not persist across restarts.");
  return fallback;
})();

const nonceStore = new Map<string, { timestamp: number; used: boolean }>();

setInterval(() => {
  const now = Date.now();
  nonceStore.forEach((data, nonce) => {
    if (now - data.timestamp > 5 * 60 * 1000) {
      nonceStore.delete(nonce);
    }
  });
}, 60 * 1000);

function signResponse(data: object, nonce: string, timestamp: number): string {
  const payload = JSON.stringify(data) + nonce + timestamp;
  return createHmac("sha256", LICENSE_SIGNING_SECRET).update(payload).digest("hex");
}

function generateValidationToken(licenseKey: string, valid: boolean, timestamp: number, context?: { domain?: string; machine_id?: string; product_id?: string }): string {
  const contextStr = context ? `${context.domain || ""}:${context.machine_id || ""}:${context.product_id || ""}` : "";
  const payload = `${licenseKey}:${valid}:${timestamp}:${contextStr}:${LICENSE_SIGNING_SECRET}`;
  return createHmac("sha256", LICENSE_SIGNING_SECRET).update(payload).digest("hex");
}

function generateLicenseKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segment = () =>
    Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `CL-${segment()}-${segment()}-${segment()}-${segment()}`;
}

function generateApiKey(): string {
  return `cl_${randomBytes(32).toString("hex")}`;
}

const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

setInterval(() => {
  const now = Date.now();
  rateLimitStore.forEach((data, key) => {
    if (now - data.windowStart > 60 * 1000) {
      rateLimitStore.delete(key);
    }
  });
}, 30 * 1000);

async function triggerWebhooks(userId: string, event: string, payload: any) {
  try {
    const userWebhooks = await storage.getWebhooksByEvent(userId, event);
    for (const webhook of userWebhooks) {
      const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (webhook.secret) {
        const signature = createHmac("sha256", webhook.secret).update(body).digest("hex");
        headers["X-Webhook-Signature"] = signature;
      }
      let statusCode = 0;
      let responseText = "";
      let success = false;
      try {
        const resp = await fetch(webhook.url, { method: "POST", headers, body });
        statusCode = resp.status;
        responseText = await resp.text().catch(() => "");
        success = resp.ok;
      } catch (err: any) {
        responseText = err.message;
      }
      await storage.createWebhookDelivery({
        webhookId: webhook.id,
        event,
        payload,
        statusCode: statusCode || undefined,
        response: responseText || undefined,
        success,
      });
      await storage.updateWebhookLastTriggered(webhook.id);
    }
  } catch (err) {
    console.error("[Webhooks] Error triggering webhooks:", err);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  const getUserId = (req: any): string => {
    if (req.user?.authType === "local") return req.user.userId;
    return req.user?.claims?.sub;
  };

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const existing = await authStorage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await authStorage.upsertUser({
        email,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
      });

      req.login(
        { authType: "local", userId: user.id, claims: { sub: user.id } },
        (err: any) => {
          if (err) return res.status(500).json({ message: "Login failed" });
          const { passwordHash, ...safeUser } = user;
          res.json(safeUser);
        }
      );
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await authStorage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.login(
        { authType: "local", userId: user.id, claims: { sub: user.id } },
        (err: any) => {
          if (err) return res.status(500).json({ message: "Login failed" });
          const { passwordHash, ...safeUser } = user;
          res.json(safeUser);
        }
      );
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out" });
    });
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Products CRUD
  app.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const result = await storage.getProducts(userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/products", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { name, slug, description, version } = req.body;

      if (!name || !slug) {
        return res.status(400).json({ message: "Name and slug are required" });
      }

      const existing = await storage.getProductBySlug(slug);
      if (existing) {
        return res.status(400).json({ message: "A product with this slug already exists" });
      }

      const product = await storage.createProduct({
        name,
        slug,
        description: description || null,
        version: version || "1.0.0",
        createdBy: userId,
      });

      await storage.createAuditLog({
        action: "product.created",
        entityType: "product",
        entityId: product.id,
        userId,
      });

      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = req.params.id as string;
      const product = await storage.getProduct(id);
      if (!product || product.createdBy !== userId) {
        return res.status(404).json({ message: "Product not found" });
      }
      await storage.deleteProduct(id);
      res.json({ message: "Product deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Licenses CRUD
  app.get("/api/licenses", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const result = await storage.getLicenses(userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/licenses", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { productId, type, customerName, customerEmail, maxActivations, expiresAt, allowedDomains } = req.body;

      if (!productId) {
        return res.status(400).json({ message: "Product is required" });
      }

      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(400).json({ message: "Product not found" });
      }

      const normalizedDomains = Array.isArray(allowedDomains)
        ? allowedDomains.map((d: string) => d.toLowerCase().replace(/^www\./, "").trim()).filter(Boolean)
        : null;

      const licenseKey = generateLicenseKey();
      const license = await storage.createLicense({
        licenseKey,
        productId,
        userId,
        type: type || "standard",
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        maxActivations: maxActivations || 1,
        expiresAt: expiresAt || null,
        status: "active",
        metadata: null,
        allowedDomains: normalizedDomains && normalizedDomains.length > 0 ? normalizedDomains : null,
      });

      await storage.createAuditLog({
        action: "license.created",
        entityType: "license",
        entityId: license.id,
        userId,
        details: { licenseKey, productId, type },
      });

      triggerWebhooks(userId, "license.created", { licenseId: license.id, licenseKey, productId, type, customerName, customerEmail });

      res.json(license);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/licenses/:id/revoke", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = req.params.id as string;
      const license = await storage.getLicense(id);
      if (!license || license.userId !== userId) {
        return res.status(404).json({ message: "License not found" });
      }
      await storage.updateLicenseStatus(id, "revoked");
      await storage.createAuditLog({
        action: "license.revoked",
        entityType: "license",
        entityId: id,
        userId,
      });

      triggerWebhooks(userId, "license.revoked", { licenseId: id, licenseKey: license.licenseKey });

      res.json({ message: "License revoked" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/licenses/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = req.params.id as string;
      const license = await storage.getLicense(id);
      if (!license || license.userId !== userId) {
        return res.status(404).json({ message: "License not found" });
      }
      await storage.deleteLicense(id);
      res.json({ message: "License deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // API Keys CRUD
  app.get("/api/api-keys", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const result = await storage.getApiKeys(userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/api-keys", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { name, productId } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      const key = generateApiKey();
      const apiKey = await storage.createApiKey({
        key,
        name,
        productId: productId && productId !== "all" ? productId : null,
        userId,
      });

      await storage.createAuditLog({
        action: "apikey.created",
        entityType: "apiKey",
        entityId: apiKey.id,
        userId,
      });

      res.json(apiKey);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/api-keys/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const keys = await storage.getApiKeys(userId);
      const found = keys.find((k) => k.id === req.params.id);
      if (!found) {
        return res.status(404).json({ message: "API key not found" });
      }
      await storage.deleteApiKey(req.params.id as string);
      res.json({ message: "API key deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Statistics
  app.get("/api/statistics", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const stats = await storage.getStatistics(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const isAdmin = async (req: any, res: any, next: any) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await storage.getAllUsers();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/users/:id/role", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { role } = req.body;
      if (!role || !["admin", "user"].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'admin' or 'user'" });
      }
      const targetUser = await storage.getUser(req.params.id as string);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.updateUserRole(req.params.id as string, role);
      await storage.createAuditLog({
        action: "admin.user.role_changed",
        entityType: "user",
        entityId: req.params.id as string,
        userId: getUserId(req),
        details: { newRole: role, targetEmail: targetUser.email },
      });
      res.json({ message: "Role updated" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminId = getUserId(req);
      if (adminId === req.params.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      const targetUser = await storage.getUser(req.params.id as string);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.deleteUser(req.params.id as string);
      await storage.createAuditLog({
        action: "admin.user.deleted",
        entityType: "user",
        entityId: req.params.id as string,
        userId: adminId,
        details: { deletedEmail: targetUser.email },
      });
      res.json({ message: "User deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/audit-logs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/licenses", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await storage.getAllLicenses();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/products", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await storage.getAllProducts();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/v1/nonce", async (_req, res) => {
    const nonce = randomBytes(32).toString("hex");
    const timestamp = Date.now();
    nonceStore.set(nonce, { timestamp, used: false });
    res.json({ nonce, timestamp, expires_in: 300 });
  });

  app.post("/api/v1/licenses/verify-token", async (req, res) => {
    try {
      const { license_key, valid, timestamp, token, domain, machine_id, product_id } = req.body;
      if (!license_key || valid === undefined || !timestamp || !token) {
        return res.status(400).json({ verified: false, message: "Missing required fields" });
      }
      const age = Date.now() - timestamp;
      if (age > 5 * 60 * 1000) {
        return res.status(400).json({ verified: false, message: "Token expired" });
      }
      const expectedToken = generateValidationToken(license_key, valid, timestamp, { domain, machine_id, product_id });
      const verified = token === expectedToken;
      return res.json({ verified });
    } catch (error: any) {
      res.status(500).json({ verified: false, message: error.message });
    }
  });

  const rateLimitMiddleware = async (req: any, res: any, next: any) => {
    const apiKeyHeader = req.headers["x-api-key"];
    if (!apiKeyHeader) {
      return next();
    }
    const ip = req.ip || "unknown";
    const key = `${apiKeyHeader}:${ip}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);
    if (!entry || now - entry.windowStart > 60 * 1000) {
      rateLimitStore.set(key, { count: 1, windowStart: now });
      return next();
    }
    entry.count++;
    const apiKeyRecord = await storage.getApiKeyByKey(apiKeyHeader);
    const limit = apiKeyRecord?.rateLimitPerMinute || 60;
    if (entry.count > limit) {
      return res.status(429).json({ message: "Rate limit exceeded. Try again later." });
    }
    next();
  };

  app.use("/api/v1", rateLimitMiddleware);

  const validateApiKey = async (req: any, res: any, next: any) => {
    const apiKeyHeader = req.headers["x-api-key"];
    if (!apiKeyHeader) {
      return res.status(401).json({ message: "API key required. Set X-API-Key header." });
    }

    const apiKey = await storage.getApiKeyByKey(apiKeyHeader);
    if (!apiKey || !apiKey.isActive) {
      return res.status(401).json({ message: "Invalid or inactive API key" });
    }

    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return res.status(401).json({ message: "API key expired" });
    }

    if (apiKey.allowedIps && apiKey.allowedIps.length > 0) {
      const clientIp = req.ip || "";
      if (!apiKey.allowedIps.includes(clientIp)) {
        return res.status(403).json({ message: "IP not allowed" });
      }
    }

    await storage.updateApiKeyLastUsed(apiKey.id);
    req.apiKey = apiKey;
    next();
  };

  app.post("/api/v1/licenses/validate", validateApiKey, async (req: any, res) => {
    try {
      const { license_key, product_id, machine_id, domain, nonce } = req.body;

      if (!license_key) {
        return res.status(400).json({ valid: false, message: "license_key is required" });
      }

      if (nonce) {
        const storedNonce = nonceStore.get(nonce);
        if (!storedNonce) {
          return res.status(400).json({ valid: false, message: "Invalid nonce. Request a new one from /api/v1/nonce" });
        }
        if (storedNonce.used) {
          return res.status(400).json({ valid: false, message: "Nonce already used. Request a new one." });
        }
        if (Date.now() - storedNonce.timestamp > 5 * 60 * 1000) {
          nonceStore.delete(nonce);
          return res.status(400).json({ valid: false, message: "Nonce expired. Request a new one." });
        }
        storedNonce.used = true;
      }

      const license = await storage.getLicenseByKey(license_key);
      if (!license) {
        return res.status(404).json({ valid: false, message: "License not found" });
      }

      if (req.apiKey.productId && req.apiKey.productId !== license.productId) {
        return res.status(403).json({ valid: false, message: "API key not authorized for this product" });
      }

      if (product_id) {
        const product = await storage.getProduct(license.productId);
        if (product && product.slug !== product_id && product.id !== product_id) {
          return res.status(400).json({ valid: false, message: "License does not match product" });
        }
      }

      if (license.allowedDomains && license.allowedDomains.length > 0 && domain) {
        const normalizedDomain = domain.toLowerCase().replace(/^www\./, "");
        const allowed = license.allowedDomains.some(
          (d: string) => d.toLowerCase().replace(/^www\./, "") === normalizedDomain
        );
        if (!allowed) {
          return res.json({
            valid: false,
            message: "License is not authorized for this domain",
            license: {
              type: license.type,
              status: license.status,
              allowed_domains: license.allowedDomains,
            },
          });
        }
      }

      if (license.status !== "active") {
        return res.json({
          valid: false,
          message: `License is ${license.status}`,
          license: {
            type: license.type,
            status: license.status,
          },
        });
      }

      if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
        await storage.updateLicenseStatus(license.id, "expired");
        return res.json({
          valid: false,
          message: "License has expired",
          license: { type: license.type, status: "expired" },
        });
      }

      if (machine_id && license.maxActivations) {
        const existingActivations = await storage.getActivationsByLicense(license.id);
        const machineActivation = existingActivations.find(
          (a) => a.machineId === machine_id && a.isActive
        );

        if (!machineActivation) {
          const activeCount = existingActivations.filter((a) => a.isActive).length;
          if (activeCount >= (license.maxActivations || 1)) {
            return res.json({
              valid: false,
              message: "Maximum activations reached",
              license: {
                type: license.type,
                status: license.status,
                activations: activeCount,
                max_activations: license.maxActivations,
              },
            });
          }

          await storage.createActivation({
            licenseId: license.id,
            machineId: machine_id,
            ipAddress: req.ip,
            isActive: true,
          });
          await storage.incrementActivations(license.id);

          if (license.userId) {
            triggerWebhooks(license.userId, "license.activated", { licenseId: license.id, licenseKey: license_key, machineId: machine_id });
          }
        }
      }

      await storage.createAuditLog({
        action: "license.validated",
        entityType: "license",
        entityId: license.id,
        details: { machine_id, product_id },
        ipAddress: req.ip,
      });

      const timestamp = Date.now();
      const responseData = {
        valid: true,
        license: {
          type: license.type,
          status: license.status,
          customer_name: license.customerName,
          expires_at: license.expiresAt,
          activations: license.currentActivations,
          max_activations: license.maxActivations,
        },
      };

      const signature = signResponse(responseData, nonce || "", timestamp);
      const validationToken = generateValidationToken(license_key, true, timestamp, { domain, machine_id, product_id });

      res.json({
        ...responseData,
        _security: {
          timestamp,
          nonce: nonce || null,
          signature,
          token: validationToken,
          algorithm: "hmac-sha256",
        },
      });
    } catch (error: any) {
      res.status(500).json({ valid: false, message: error.message });
    }
  });

  app.post("/api/v1/licenses/activate", validateApiKey, async (req: any, res) => {
    try {
      const { license_key, machine_id, hostname } = req.body;

      if (!license_key || !machine_id) {
        return res.status(400).json({ success: false, message: "license_key and machine_id are required" });
      }

      const license = await storage.getLicenseByKey(license_key);
      if (!license || license.status !== "active") {
        return res.status(404).json({ success: false, message: "Active license not found" });
      }

      const existingActivations = await storage.getActivationsByLicense(license.id);
      const existing = existingActivations.find((a) => a.machineId === machine_id && a.isActive);
      if (existing) {
        return res.json({ success: true, activation: existing, message: "Already activated on this machine" });
      }

      const activeCount = existingActivations.filter((a) => a.isActive).length;
      if (activeCount >= (license.maxActivations || 1)) {
        return res.status(400).json({ success: false, message: "Maximum activations reached" });
      }

      const activation = await storage.createActivation({
        licenseId: license.id,
        machineId: machine_id,
        hostname: hostname || null,
        ipAddress: req.ip,
        isActive: true,
      });

      await storage.incrementActivations(license.id);
      res.json({ success: true, activation });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get("/api/v1/licenses/info/:key", async (req, res) => {
    try {
      const license = await storage.getLicenseByKey(req.params.key);
      if (!license) {
        return res.status(404).json({ message: "License not found" });
      }

      const product = await storage.getProduct(license.productId);

      res.json({
        licenseKey: license.licenseKey,
        productName: product?.name || "Unknown",
        type: license.type,
        status: license.status,
        customerName: license.customerName || null,
        maxActivations: license.maxActivations,
        currentActivations: license.currentActivations,
        allowedDomains: license.allowedDomains,
        expiresAt: license.expiresAt,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/v1/licenses/deactivate", validateApiKey, async (req: any, res) => {
    try {
      const { license_key, machine_id } = req.body;

      if (!license_key || !machine_id) {
        return res.status(400).json({ success: false, message: "license_key and machine_id are required" });
      }

      const license = await storage.getLicenseByKey(license_key);
      if (!license) {
        return res.status(404).json({ success: false, message: "License not found" });
      }

      const deactivated = await storage.deactivateByMachine(license.id, machine_id);
      if (deactivated) {
        await storage.decrementActivations(license.id);
      }

      res.json({ success: true, message: "License deactivated successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Webhook CRUD routes
  app.get("/api/webhooks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const result = await storage.getWebhooks(userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/webhooks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { url, events, secret, isActive } = req.body;
      if (!url || !events || !Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ message: "url and events are required" });
      }
      const webhook = await storage.createWebhook({
        userId,
        url,
        events,
        secret: secret || null,
        isActive: isActive !== undefined ? isActive : true,
      });
      res.json(webhook);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/webhooks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const webhooksList = await storage.getWebhooks(userId);
      const found = webhooksList.find((w) => w.id === req.params.id);
      if (!found) {
        return res.status(404).json({ message: "Webhook not found" });
      }
      await storage.deleteWebhook(req.params.id);
      res.json({ message: "Webhook deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/webhooks/:id/deliveries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const webhooksList = await storage.getWebhooks(userId);
      const found = webhooksList.find((w) => w.id === req.params.id);
      if (!found) {
        return res.status(404).json({ message: "Webhook not found" });
      }
      const deliveries = await storage.getWebhookDeliveries(req.params.id);
      res.json(deliveries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // License transfer route
  app.post("/api/licenses/:id/transfer", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const id = req.params.id as string;
      const { toName, toEmail } = req.body;
      if (!toName || !toEmail) {
        return res.status(400).json({ message: "toName and toEmail are required" });
      }
      const license = await storage.getLicense(id);
      if (!license || license.userId !== userId) {
        return res.status(404).json({ message: "License not found" });
      }
      const fromName = license.customerName || "";
      const fromEmail = license.customerEmail || "";
      await storage.updateLicenseCustomer(id, toName, toEmail);
      await storage.createAuditLog({
        action: "license.transferred",
        entityType: "license",
        entityId: id,
        userId,
        details: { fromName, fromEmail, toName, toEmail },
      });
      await storage.createNotification({
        userId,
        type: "license_transfer",
        title: "License Transferred",
        body: `License ${license.licenseKey} transferred from ${fromEmail} to ${toEmail}`,
        metadata: { licenseId: id, fromName, fromEmail, toName, toEmail },
      });
      triggerWebhooks(userId, "license.transferred", { licenseId: id, licenseKey: license.licenseKey, fromName, fromEmail, toName, toEmail });
      res.json({ message: "License transferred successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Notification routes
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const result = await storage.getNotifications(userId, 50);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      await storage.markAllNotificationsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Customer portal route (public)
  app.post("/api/portal/licenses", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const result = await storage.getLicensesByEmail(email);
      const safeLicenses = result.map((l) => ({
        id: l.id,
        licenseKey: l.licenseKey,
        productId: l.productId,
        productName: l.productName,
        customerName: l.customerName,
        customerEmail: l.customerEmail,
        type: l.type,
        status: l.status,
        maxActivations: l.maxActivations,
        currentActivations: l.currentActivations,
        allowedDomains: l.allowedDomains,
        expiresAt: l.expiresAt,
        createdAt: l.createdAt,
      }));
      res.json(safeLicenses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // API key update route
  app.patch("/api/api-keys/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const keys = await storage.getApiKeys(userId);
      const found = keys.find((k) => k.id === req.params.id);
      if (!found) {
        return res.status(404).json({ message: "API key not found" });
      }
      const { allowedIps, rateLimitPerMinute } = req.body;
      await storage.updateApiKey(req.params.id, {
        allowedIps: allowedIps !== undefined ? allowedIps : undefined,
        rateLimitPerMinute: rateLimitPerMinute !== undefined ? rateLimitPerMinute : undefined,
      });
      res.json({ message: "API key updated" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Scheduled jobs - run every hour
  setInterval(async () => {
    try {
      const expiredLicenses = await storage.getExpiredActiveLicenses();
      for (const license of expiredLicenses) {
        await storage.updateLicenseStatus(license.id, "expired");
        await storage.createAuditLog({
          action: "license.expired",
          entityType: "license",
          entityId: license.id,
          userId: license.userId || undefined,
          details: { licenseKey: license.licenseKey, expiredAt: license.expiresAt },
        });
        if (license.userId) {
          await storage.createNotification({
            userId: license.userId,
            type: "license_expired",
            title: "License Expired",
            body: `License ${license.licenseKey} has expired`,
            metadata: { licenseId: license.id },
          });
          triggerWebhooks(license.userId, "license.expired", { licenseId: license.id, licenseKey: license.licenseKey });
        }
      }

      const expiringLicenses = await storage.getExpiringLicenses(7);
      for (const license of expiringLicenses) {
        if (license.userId) {
          const existing = await storage.getNotifications(license.userId, 50);
          const alreadyNotified = existing.some(
            (n) => n.type === "expiry_reminder" && n.metadata && (n.metadata as any).licenseId === license.id
          );
          if (!alreadyNotified) {
            await storage.createNotification({
              userId: license.userId,
              type: "expiry_reminder",
              title: "License Expiring Soon",
              body: `License ${license.licenseKey} will expire on ${license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : "soon"}`,
              metadata: { licenseId: license.id },
            });
          }
        }
      }
    } catch (err) {
      console.error("[Scheduled] Error in license expiry check:", err);
    }
  }, 60 * 60 * 1000);

  return httpServer;
}
