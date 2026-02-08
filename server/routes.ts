import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { randomBytes } from "crypto";

function generateLicenseKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `LG-${segment()}-${segment()}-${segment()}-${segment()}`;
}

function generateApiKey(): string {
  return `lg_${randomBytes(32).toString("hex")}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  const getUserId = (req: any): string => req.user?.claims?.sub;

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
      const product = await storage.getProduct(req.params.id);
      if (!product || product.createdBy !== userId) {
        return res.status(404).json({ message: "Product not found" });
      }
      await storage.deleteProduct(req.params.id);
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
      const { productId, type, customerName, customerEmail, maxActivations, expiresAt } = req.body;

      if (!productId) {
        return res.status(400).json({ message: "Product is required" });
      }

      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(400).json({ message: "Product not found" });
      }

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
      });

      await storage.createAuditLog({
        action: "license.created",
        entityType: "license",
        entityId: license.id,
        userId,
        details: { licenseKey, productId, type },
      });

      res.json(license);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/licenses/:id/revoke", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const license = await storage.getLicense(req.params.id);
      if (!license || license.userId !== userId) {
        return res.status(404).json({ message: "License not found" });
      }
      await storage.updateLicenseStatus(req.params.id, "revoked");
      await storage.createAuditLog({
        action: "license.revoked",
        entityType: "license",
        entityId: req.params.id,
        userId,
      });
      res.json({ message: "License revoked" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/licenses/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const license = await storage.getLicense(req.params.id);
      if (!license || license.userId !== userId) {
        return res.status(404).json({ message: "License not found" });
      }
      await storage.deleteLicense(req.params.id);
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
      await storage.deleteApiKey(req.params.id);
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

  // Admin routes
  app.get("/api/admin/users", isAuthenticated, async (req, res) => {
    try {
      const result = await storage.getAllUsers();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Public API v1 - License validation (requires API key)
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

    await storage.updateApiKeyLastUsed(apiKey.id);
    req.apiKey = apiKey;
    next();
  };

  app.post("/api/v1/licenses/validate", validateApiKey, async (req: any, res) => {
    try {
      const { license_key, product_id, machine_id } = req.body;

      if (!license_key) {
        return res.status(400).json({ valid: false, message: "license_key is required" });
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
        }
      }

      await storage.createAuditLog({
        action: "license.validated",
        entityType: "license",
        entityId: license.id,
        details: { machine_id, product_id },
        ipAddress: req.ip,
      });

      res.json({
        valid: true,
        license: {
          type: license.type,
          status: license.status,
          customer_name: license.customerName,
          expires_at: license.expiresAt,
          activations: license.currentActivations,
          max_activations: license.maxActivations,
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

  return httpServer;
}
