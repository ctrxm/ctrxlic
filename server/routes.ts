import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated, authStorage } from "./replit_integrations/auth";
import { randomBytes, createHmac, createCipheriv, createHash } from "crypto";
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

async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<{ ok: boolean; description?: string }> {
  try {
    const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    return await resp.json() as { ok: boolean; description?: string };
  } catch (err: any) {
    console.error("[Telegram] Error sending message:", err.message);
    return { ok: false, description: err.message };
  }
}

function maskLicenseKey(key: string): string {
  if (!key || key.length < 8) return "****";
  const parts = key.split("-");
  if (parts.length >= 4) {
    return `${parts[0]}-${parts[1]}-***-***`;
  }
  return key.substring(0, 6) + "***" + key.substring(key.length - 3);
}

async function sendTelegramNotification(message: string) {
  try {
    const botToken = await storage.getSetting("telegram.botToken");
    const chatId = await storage.getSetting("telegram.chatId");
    const enabled = await storage.getSetting("telegram.enabled");
    if (!botToken || !chatId || enabled !== "true") return;
    const result = await sendTelegramMessage(botToken, chatId, message);
    if (!result.ok) {
      console.error("[Telegram] Failed to send:", result.description);
    }
  } catch (err) {
    console.error("[Telegram] Notification error:", err);
  }
}

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
      await sendTelegramNotification(`🔑 <b>New License Created</b>\nKey: <code>${maskLicenseKey(licenseKey)}</code>\nType: ${type}\nCustomer: ${customerName || "N/A"}\nEmail: ${customerEmail || "N/A"}`);

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

  app.get("/api/admin/plans", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await storage.getPlans();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/plans", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { name, displayName, priceMonthly, maxProducts, maxLicenses, maxApiKeys, maxActivationsPerLicense, features, isDefault, isActive } = req.body;
      if (!name || typeof name !== "string" || !displayName || typeof displayName !== "string") {
        return res.status(400).json({ message: "Name and display name are required" });
      }
      const plan = await storage.createPlan({
        name: name.trim().toLowerCase(),
        displayName: displayName.trim(),
        priceMonthly: typeof priceMonthly === "number" ? priceMonthly : 0,
        maxProducts: typeof maxProducts === "number" ? maxProducts : 3,
        maxLicenses: typeof maxLicenses === "number" ? maxLicenses : 10,
        maxApiKeys: typeof maxApiKeys === "number" ? maxApiKeys : 2,
        maxActivationsPerLicense: typeof maxActivationsPerLicense === "number" ? maxActivationsPerLicense : 1,
        features: Array.isArray(features) ? features.filter((f: any) => typeof f === "string") : [],
        isDefault: isDefault === true,
        isActive: isActive !== false,
      });
      await storage.createAuditLog({
        action: "plan.created",
        entityType: "plan",
        entityId: plan.id,
        userId: req.user?.id,
        details: { planName: name },
      });
      res.json(plan);
    } catch (error: any) {
      if (error.message?.includes("unique") || error.code === "23505") {
        return res.status(400).json({ message: "A plan with this name already exists" });
      }
      res.status(500).json({ message: error.message });
    }
  });

  const ALLOWED_PLAN_FIELDS = ["name", "displayName", "priceMonthly", "maxProducts", "maxLicenses", "maxApiKeys", "maxActivationsPerLicense", "features", "isDefault", "isActive"];

  app.patch("/api/admin/plans/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const sanitized: any = {};
      for (const key of ALLOWED_PLAN_FIELDS) {
        if (req.body[key] !== undefined) {
          sanitized[key] = req.body[key];
        }
      }
      if (sanitized.name) sanitized.name = String(sanitized.name).trim().toLowerCase();
      if (sanitized.displayName) sanitized.displayName = String(sanitized.displayName).trim();
      if (sanitized.features && Array.isArray(sanitized.features)) {
        sanitized.features = sanitized.features.filter((f: any) => typeof f === "string");
      }
      const plan = await storage.updatePlan(req.params.id, sanitized);
      await storage.createAuditLog({
        action: "plan.updated",
        entityType: "plan",
        entityId: req.params.id,
        userId: req.user?.id,
        details: sanitized,
      });
      res.json(plan);
    } catch (error: any) {
      if (error.message?.includes("unique") || error.code === "23505") {
        return res.status(400).json({ message: "A plan with this name already exists" });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/plans/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await storage.deletePlan(req.params.id);
      await storage.createAuditLog({
        action: "plan.deleted",
        entityType: "plan",
        entityId: req.params.id,
        userId: req.user?.id,
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      const result: Record<string, string> = {};
      for (const s of settings) {
        result[s.key] = s.value;
      }
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const ALLOWED_SETTINGS_KEYS = new Set([
    "platform.name", "platform.defaultRateLimit", "platform.defaultMaxActivations", "platform.licenseFormat",
    "security.sessionTimeoutMinutes", "security.passwordMinLength", "security.requireSpecialChar", "security.twoFactorEnabled",
    "general.maintenanceMode", "general.registrationEnabled", "general.defaultUserRole", "general.allowReplitAuth",
    "telegram.botToken", "telegram.chatId", "telegram.enabled",
  ]);

  app.put("/api/admin/settings", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const entries = Object.entries(req.body)
        .filter(([key]) => ALLOWED_SETTINGS_KEYS.has(key))
        .map(([key, value]) => ({ key, value: String(value) }));
      if (entries.length === 0) {
        return res.status(400).json({ message: "No valid settings provided" });
      }
      await storage.upsertSettings(entries);
      await storage.createAuditLog({
        action: "settings.updated",
        entityType: "settings",
        userId: req.user?.id,
        details: { keys: entries.map(e => e.key) },
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/users/:id/plan", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { planId } = req.body;
      await storage.updateUserPlan(req.params.id, planId || null);
      await storage.createAuditLog({
        action: "user.plan_updated",
        entityType: "user",
        entityId: req.params.id,
        userId: req.user?.id,
        details: { planId },
      });
      res.json({ success: true });
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
            await sendTelegramNotification(`✅ <b>License Activated</b>\nKey: <code>${maskLicenseKey(license_key)}</code>\nMachine: ${machine_id}\nIP: ${req.ip || "N/A"}`);
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

      if (license.userId) {
        storage.createValidationLog({
          licenseId: license.id,
          userId: license.userId,
          action: "validate",
          ipAddress: req.ip || null,
          domain: domain || null,
          machineId: machine_id || null,
          success: true,
        }).catch(() => {});
      }

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

  // License renewal endpoint
  app.post("/api/licenses/:id/renew", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const license = await storage.getLicense(req.params.id);
      if (!license) {
        return res.status(404).json({ message: "License not found" });
      }
      if (license.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const { expiresAt } = req.body;
      if (!expiresAt) {
        return res.status(400).json({ message: "expiresAt is required" });
      }
      const newExpiry = new Date(expiresAt);
      if (isNaN(newExpiry.getTime()) || newExpiry <= new Date()) {
        return res.status(400).json({ message: "Invalid expiry date. Must be in the future." });
      }
      const previousExpiry = license.expiresAt;
      await storage.renewLicense(license.id, newExpiry);
      await storage.createAuditLog({
        action: "license.renewed",
        entityType: "license",
        entityId: license.id,
        userId,
        details: { previousExpiresAt: previousExpiry, newExpiresAt: newExpiry, licenseKey: license.licenseKey },
      });
      await storage.createNotification({
        userId,
        type: "license_renewed",
        title: "License Renewed",
        body: `License ${license.licenseKey} renewed until ${newExpiry.toLocaleDateString()}`,
        metadata: { licenseId: license.id },
      });
      triggerWebhooks(userId, "license.renewed", { licenseId: license.id, licenseKey: license.licenseKey, newExpiresAt: newExpiry });
      await sendTelegramNotification(`🔄 <b>License Renewed</b>\nKey: <code>${maskLicenseKey(license.licenseKey)}</code>\nNew Expiry: ${newExpiry.toLocaleDateString()}\nCustomer: ${license.customerName || "N/A"}`);
      res.json({ message: "License renewed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Validation heatmap endpoint
  app.get("/api/statistics/heatmap", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const heatmap = await storage.getValidationHeatmap(userId);
      res.json(heatmap);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Telegram test notification
  app.post("/api/admin/telegram/test", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user?.claims?.sub ? await storage.getUser(req.user.claims.sub) : req.user?.userId ? await storage.getUser(req.user.userId) : null;
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const botToken = await storage.getSetting("telegram.botToken");
      const chatId = await storage.getSetting("telegram.chatId");
      if (!botToken || !chatId) {
        return res.status(400).json({ message: "Telegram bot token and chat ID must be configured first" });
      }
      const result = await sendTelegramMessage(botToken, chatId, "CTRXL LICENSE - Test Notification\nThis is a test message from your license management platform.");
      if (result.ok) {
        res.json({ message: "Test notification sent successfully" });
      } else {
        res.status(400).json({ message: `Telegram API error: ${result.description || "Unknown error"}` });
      }
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
          await sendTelegramNotification(`⚠️ <b>License Expired</b>\nKey: <code>${maskLicenseKey(license.licenseKey)}</code>\nCustomer: ${license.customerName || "N/A"}`);
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

  // SDK Obfuscation endpoint - obfuscates SDK files to make them harder to read/modify
  app.post("/api/sdk/encrypt", isAuthenticated, async (req, res) => {
    try {
      const { code, language } = req.body;
      if (!code || !language) {
        return res.status(400).json({ message: "Code and language are required" });
      }
      if (!["php", "typescript", "javascript", "python"].includes(language)) {
        return res.status(400).json({ message: "Unsupported language" });
      }
      if (code.length > 200000) {
        return res.status(400).json({ message: "Code too large" });
      }

      let encrypted = "";

      if (language === "php") {
        const varNames = [
          "$_0x" + randomBytes(4).toString("hex"),
          "$_0x" + randomBytes(4).toString("hex"),
        ];
        const encoded = Buffer.from(code).toString("base64");
        const chunkSize = 76;
        const chunks: string[] = [];
        for (let i = 0; i < encoded.length; i += chunkSize) {
          chunks.push(encoded.slice(i, i + chunkSize));
        }
        encrypted = `<?php
/*
 * CTRXL LicenseGuard SDK v2.0 (Obfuscated)
 * This file is protected. Modifying it will break license validation.
 * Generated: ${new Date().toISOString()}
 */
${varNames[0]} = array(
${chunks.map((c) => `    '${c}'`).join(",\n")}
);
${varNames[1]} = '';
foreach(${varNames[0]} as $__p) { ${varNames[1]} .= $__p; }
eval(base64_decode(${varNames[1]}));
`;
      } else if (language === "typescript" || language === "javascript") {
        const encoded = Buffer.from(code).toString("base64");
        const chunks: string[] = [];
        const chunkSize = 76;
        for (let i = 0; i < encoded.length; i += chunkSize) {
          chunks.push(encoded.slice(i, i + chunkSize));
        }
        const v1 = "_0x" + randomBytes(4).toString("hex");
        const v2 = "_0x" + randomBytes(4).toString("hex");
        encrypted = `/**
 * CTRXL LicenseGuard SDK v2.0 (Obfuscated)
 * This file is protected. Modifying it will break license validation.
 * Generated: ${new Date().toISOString()}
 */
const ${v1} = [
${chunks.map((c) => `  '${c}'`).join(",\n")}
];
const ${v2} = Buffer.from(${v1}.join(''), 'base64').toString('utf8');
const __m = { exports: {} };
new Function('module', 'exports', 'require', '__filename', '__dirname', ${v2})(__m, __m.exports, require, __filename, __dirname);
module.exports = __m.exports;
`;
      } else if (language === "python") {
        const encoded = Buffer.from(code).toString("base64");
        const chunks: string[] = [];
        const chunkSize = 76;
        for (let i = 0; i < encoded.length; i += chunkSize) {
          chunks.push(encoded.slice(i, i + chunkSize));
        }
        const v1 = "_0x" + randomBytes(4).toString("hex");
        encrypted = `# -*- coding: utf-8 -*-
"""
CTRXL LicenseGuard SDK v2.0 (Obfuscated)
This file is protected. Modifying it will break license validation.
Generated: ${new Date().toISOString()}
"""
import base64 as _b64
${v1} = (
${chunks.map((c) => `    '${c}'`).join("\n")}
)
exec(compile(_b64.b64decode(${v1}).decode('utf-8'), '<ctrxl>', 'exec'))
`;
      }

      res.json({ encrypted, language });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Obfuscation failed" });
    }
  });

  // Generate standalone install.html page for buyers
  app.get("/api/sdk/install-page", isAuthenticated, async (req, res) => {
    const apiUrl = (req.query.apiUrl as string) || `${req.protocol}://${req.get("host")}`;
    const installHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>License Activation - CTRXL</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0f;color:#e4e4e7;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
    .container{max-width:480px;width:100%}
    .card{background:#18181b;border:1px solid #27272a;border-radius:12px;padding:32px;margin-bottom:16px}
    .logo{display:flex;align-items:center;gap:8px;margin-bottom:24px;justify-content:center}
    .logo svg{width:28px;height:28px;color:#8b5cf6}
    .logo span{font-size:18px;font-weight:700;letter-spacing:-0.5px}
    h1{font-size:22px;font-weight:700;text-align:center;margin-bottom:8px}
    .subtitle{text-align:center;color:#a1a1aa;font-size:14px;margin-bottom:24px}
    label{display:block;font-size:13px;font-weight:500;margin-bottom:6px;color:#d4d4d8}
    input{width:100%;padding:10px 14px;background:#09090b;border:1px solid #27272a;border-radius:8px;color:#fafafa;font-size:14px;font-family:monospace;outline:none;transition:border-color 0.2s}
    input:focus{border-color:#8b5cf6}
    input::placeholder{color:#52525b}
    .btn{width:100%;padding:12px;background:linear-gradient(135deg,#7c3aed,#8b5cf6);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;margin-top:16px;transition:opacity 0.2s}
    .btn:hover{opacity:0.9}
    .btn:disabled{opacity:0.5;cursor:not-allowed}
    .status{margin-top:16px;padding:12px;border-radius:8px;font-size:13px;display:none}
    .status.success{display:block;background:#052e16;border:1px solid #166534;color:#4ade80}
    .status.error{display:block;background:#450a0a;border:1px solid #991b1b;color:#fca5a5}
    .status.loading{display:block;background:#172554;border:1px solid #1e40af;color:#93c5fd}
    .info{margin-top:20px;padding:16px;background:#09090b;border:1px solid #27272a;border-radius:8px}
    .info h3{font-size:14px;font-weight:600;margin-bottom:8px}
    .info p{font-size:12px;color:#a1a1aa;line-height:1.6}
    .info code{background:#27272a;padding:2px 6px;border-radius:4px;font-size:11px;color:#a78bfa}
    .steps{margin-top:16px}
    .step{display:flex;gap:12px;margin-bottom:12px}
    .step-num{width:24px;height:24px;background:linear-gradient(135deg,#7c3aed,#8b5cf6);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
    .step-text{font-size:13px;color:#d4d4d8}
    .footer{text-align:center;font-size:12px;color:#52525b;margin-top:16px}
    .result-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
    .result-item{font-size:12px}
    .result-item .label{color:#71717a;font-size:11px}
    .result-item .value{color:#d4d4d8;font-weight:500;margin-top:2px}
    .badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:500}
    .badge.active{background:#052e16;color:#4ade80;border:1px solid #166534}
    .badge.inactive{background:#450a0a;color:#fca5a5;border:1px solid #991b1b}
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
        <span>CTRXL LICENSE</span>
      </div>
      <h1>Activate Your License</h1>
      <p class="subtitle">Enter your license key to activate this application</p>
      <form id="licenseForm" onsubmit="return validateLicense(event)">
        <label for="licenseKey">License Key</label>
        <input type="text" id="licenseKey" name="licenseKey" placeholder="CL-XXX-XXX-XXX-XXX" required autocomplete="off" />
        <button type="submit" class="btn" id="submitBtn">Activate License</button>
      </form>
      <div id="status" class="status"></div>
      <div id="licenseInfo" style="display:none"></div>
    </div>
    <div class="card">
      <div class="info">
        <h3>Setup Instructions</h3>
        <div class="steps">
          <div class="step"><div class="step-num">1</div><div class="step-text">Find <code>.env</code> or <code>config.php</code> in your project</div></div>
          <div class="step"><div class="step-num">2</div><div class="step-text">Set <code>CTRXL_LICENSE_KEY</code> to your license key</div></div>
          <div class="step"><div class="step-num">3</div><div class="step-text">Set <code>CTRXL_API_KEY</code> (provided by seller)</div></div>
          <div class="step"><div class="step-num">4</div><div class="step-text">Restart the application</div></div>
        </div>
      </div>
    </div>
    <p class="footer">Powered by CTRXL LICENSE</p>
  </div>
  <script>
    const API_URL = '${apiUrl}';
    async function validateLicense(e) {
      e.preventDefault();
      const key = document.getElementById('licenseKey').value.trim();
      const status = document.getElementById('status');
      const btn = document.getElementById('submitBtn');
      const info = document.getElementById('licenseInfo');
      if (!key) return false;
      status.className = 'status loading';
      status.textContent = 'Validating license...';
      btn.disabled = true;
      try {
        const resp = await fetch(API_URL + '/api/v1/licenses/info/' + encodeURIComponent(key));
        const data = await resp.json();
        if (resp.ok && data.license) {
          const l = data.license;
          const isActive = l.status === 'active';
          status.className = 'status ' + (isActive ? 'success' : 'error');
          status.textContent = isActive ? 'License is valid and active!' : 'License found but status is: ' + l.status;
          info.style.display = 'block';
          info.innerHTML = '<div class="result-grid">' +
            '<div class="result-item"><div class="label">Status</div><div class="value"><span class="badge ' + (isActive ? 'active' : 'inactive') + '">' + l.status + '</span></div></div>' +
            '<div class="result-item"><div class="label">Type</div><div class="value">' + (l.type || '-') + '</div></div>' +
            '<div class="result-item"><div class="label">Product</div><div class="value">' + (l.productName || '-') + '</div></div>' +
            '<div class="result-item"><div class="label">Expires</div><div class="value">' + (l.expiresAt ? new Date(l.expiresAt).toLocaleDateString() : 'Never') + '</div></div>' +
            '</div>';
        } else {
          status.className = 'status error';
          status.textContent = data.message || 'License key not found. Please check and try again.';
          info.style.display = 'none';
        }
      } catch(err) {
        status.className = 'status error';
        status.textContent = 'Could not connect to license server. Please try again later.';
        info.style.display = 'none';
      }
      btn.disabled = false;
      return false;
    }
    // Auto-fill from URL params
    const params = new URLSearchParams(window.location.search);
    const keyParam = params.get('key') || window.location.pathname.split('/install/')[1];
    if (keyParam) {
      document.getElementById('licenseKey').value = decodeURIComponent(keyParam);
    }
  </script>
</body>
</html>`;
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", 'attachment; filename="install.html"');
    res.send(installHtml);
  });

  return httpServer;
}
