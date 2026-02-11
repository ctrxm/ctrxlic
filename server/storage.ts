import {
  products, licenses, apiKeys, activations, auditLogs, webhooks, webhookDeliveries, notifications,
  plans, platformSettings,
  type Product, type InsertProduct,
  type License, type InsertLicense,
  type ApiKey, type InsertApiKey,
  type Activation, type InsertActivation,
  type AuditLog,
  type Webhook, type InsertWebhook,
  type WebhookDelivery,
  type Notification, type InsertNotification,
  type Plan, type InsertPlan,
  type PlatformSetting,
} from "@shared/schema";
import { users, type User } from "@shared/models/auth";
import { db } from "./db";
import { eq, desc, sql, and, count, lt, gt, gte, lte, isNull, ne } from "drizzle-orm";

export interface IStorage {
  getProducts(userId: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(data: InsertProduct): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  getLicenses(userId?: string): Promise<(License & { productName?: string })[]>;
  getLicense(id: string): Promise<License | undefined>;
  getLicenseByKey(key: string): Promise<License | undefined>;
  createLicense(data: InsertLicense & { licenseKey: string }): Promise<License>;
  updateLicenseStatus(id: string, status: string): Promise<void>;
  updateLicenseCustomer(id: string, customerName: string, customerEmail: string): Promise<void>;
  incrementActivations(id: string): Promise<void>;
  decrementActivations(id: string): Promise<void>;
  deleteLicense(id: string): Promise<void>;
  getExpiringLicenses(withinDays: number): Promise<License[]>;
  getExpiredActiveLicenses(): Promise<License[]>;

  getApiKeys(userId?: string): Promise<(ApiKey & { productName?: string })[]>;
  getApiKeyByKey(key: string): Promise<ApiKey | undefined>;
  createApiKey(data: InsertApiKey & { key: string }): Promise<ApiKey>;
  updateApiKeyLastUsed(id: string): Promise<void>;
  updateApiKey(id: string, data: { allowedIps?: string[] | null; rateLimitPerMinute?: number | null }): Promise<void>;
  deleteApiKey(id: string): Promise<void>;

  createActivation(data: InsertActivation & { ipAddress?: string }): Promise<Activation>;
  getActivationsByLicense(licenseId: string): Promise<Activation[]>;
  deactivateByMachine(licenseId: string, machineId: string): Promise<boolean>;

  createAuditLog(data: { action: string; entityType: string; entityId?: string; userId?: string; details?: any; ipAddress?: string }): Promise<void>;

  getWebhooks(userId: string): Promise<Webhook[]>;
  getWebhooksByEvent(userId: string, event: string): Promise<Webhook[]>;
  createWebhook(data: InsertWebhook): Promise<Webhook>;
  deleteWebhook(id: string): Promise<void>;
  updateWebhookLastTriggered(id: string): Promise<void>;
  createWebhookDelivery(data: { webhookId: string; event: string; payload: any; statusCode?: number; response?: string; success: boolean }): Promise<void>;
  getWebhookDeliveries(webhookId: string, limit?: number): Promise<WebhookDelivery[]>;

  getNotifications(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  getLicensesByEmail(email: string): Promise<(License & { productName?: string })[]>;

  getDashboardStats(userId: string): Promise<any>;
  getStatistics(userId: string): Promise<any>;
  getAllUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  updateUserRole(id: string, role: string): Promise<void>;
  deleteUser(id: string): Promise<void>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  getAdminStats(): Promise<any>;
  getAllLicenses(): Promise<(License & { productName?: string })[]>;
  getAllProducts(): Promise<Product[]>;

  getPlans(): Promise<Plan[]>;
  getPlan(id: string): Promise<Plan | undefined>;
  createPlan(data: InsertPlan): Promise<Plan>;
  updatePlan(id: string, data: Partial<InsertPlan>): Promise<Plan>;
  deletePlan(id: string): Promise<void>;

  getSettings(): Promise<PlatformSetting[]>;
  getSetting(key: string): Promise<string | null>;
  upsertSettings(settings: { key: string; value: string }[]): Promise<void>;

  updateUserPlan(userId: string, planId: string | null): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(userId: string): Promise<Product[]> {
    return db.select().from(products).where(eq(products.createdBy, userId)).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }

  async createProduct(data: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(data).returning();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getLicenses(userId?: string): Promise<(License & { productName?: string })[]> {
    const result = await db
      .select({
        id: licenses.id,
        licenseKey: licenses.licenseKey,
        productId: licenses.productId,
        userId: licenses.userId,
        customerName: licenses.customerName,
        customerEmail: licenses.customerEmail,
        type: licenses.type,
        status: licenses.status,
        maxActivations: licenses.maxActivations,
        currentActivations: licenses.currentActivations,
        allowedDomains: licenses.allowedDomains,
        expiresAt: licenses.expiresAt,
        metadata: licenses.metadata,
        createdAt: licenses.createdAt,
        updatedAt: licenses.updatedAt,
        productName: products.name,
      })
      .from(licenses)
      .leftJoin(products, eq(licenses.productId, products.id))
      .where(userId ? eq(licenses.userId, userId) : undefined)
      .orderBy(desc(licenses.createdAt));
    return result as (License & { productName?: string })[];
  }

  async getLicense(id: string): Promise<License | undefined> {
    const [license] = await db.select().from(licenses).where(eq(licenses.id, id));
    return license;
  }

  async getLicenseByKey(key: string): Promise<License | undefined> {
    const [license] = await db.select().from(licenses).where(eq(licenses.licenseKey, key));
    return license;
  }

  async createLicense(data: InsertLicense & { licenseKey: string }): Promise<License> {
    const [license] = await db.insert(licenses).values({
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    }).returning();
    return license;
  }

  async updateLicenseStatus(id: string, status: string): Promise<void> {
    await db.update(licenses).set({ status, updatedAt: new Date() }).where(eq(licenses.id, id));
  }

  async updateLicenseCustomer(id: string, customerName: string, customerEmail: string): Promise<void> {
    await db.update(licenses).set({ customerName, customerEmail, updatedAt: new Date() }).where(eq(licenses.id, id));
  }

  async incrementActivations(id: string): Promise<void> {
    await db.update(licenses).set({
      currentActivations: sql`${licenses.currentActivations} + 1`,
      updatedAt: new Date(),
    }).where(eq(licenses.id, id));
  }

  async decrementActivations(id: string): Promise<void> {
    await db.update(licenses).set({
      currentActivations: sql`GREATEST(${licenses.currentActivations} - 1, 0)`,
      updatedAt: new Date(),
    }).where(eq(licenses.id, id));
  }

  async deleteLicense(id: string): Promise<void> {
    await db.delete(activations).where(eq(activations.licenseId, id));
    await db.delete(licenses).where(eq(licenses.id, id));
  }

  async getExpiringLicenses(withinDays: number): Promise<License[]> {
    const now = new Date();
    const future = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
    return db.select().from(licenses).where(
      and(
        eq(licenses.status, "active"),
        gt(licenses.expiresAt, now),
        lte(licenses.expiresAt, future)
      )
    );
  }

  async getExpiredActiveLicenses(): Promise<License[]> {
    return db.select().from(licenses).where(
      and(
        eq(licenses.status, "active"),
        lt(licenses.expiresAt, new Date())
      )
    );
  }

  async getApiKeys(userId?: string): Promise<(ApiKey & { productName?: string })[]> {
    const result = await db
      .select({
        id: apiKeys.id,
        key: apiKeys.key,
        name: apiKeys.name,
        productId: apiKeys.productId,
        userId: apiKeys.userId,
        permissions: apiKeys.permissions,
        isActive: apiKeys.isActive,
        allowedIps: apiKeys.allowedIps,
        rateLimitPerMinute: apiKeys.rateLimitPerMinute,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
        productName: products.name,
      })
      .from(apiKeys)
      .leftJoin(products, eq(apiKeys.productId, products.id))
      .where(userId ? eq(apiKeys.userId, userId) : undefined)
      .orderBy(desc(apiKeys.createdAt));
    return result as (ApiKey & { productName?: string })[];
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.key, key));
    return apiKey;
  }

  async createApiKey(data: InsertApiKey & { key: string }): Promise<ApiKey> {
    const [apiKey] = await db.insert(apiKeys).values(data).returning();
    return apiKey;
  }

  async updateApiKeyLastUsed(id: string): Promise<void> {
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, id));
  }

  async updateApiKey(id: string, data: { allowedIps?: string[] | null; rateLimitPerMinute?: number | null }): Promise<void> {
    const updateData: any = {};
    if (data.allowedIps !== undefined) updateData.allowedIps = data.allowedIps;
    if (data.rateLimitPerMinute !== undefined) updateData.rateLimitPerMinute = data.rateLimitPerMinute;
    await db.update(apiKeys).set(updateData).where(eq(apiKeys.id, id));
  }

  async deleteApiKey(id: string): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
  }

  async createActivation(data: InsertActivation & { ipAddress?: string }): Promise<Activation> {
    const [activation] = await db.insert(activations).values(data).returning();
    return activation;
  }

  async getActivationsByLicense(licenseId: string): Promise<Activation[]> {
    return db.select().from(activations).where(eq(activations.licenseId, licenseId));
  }

  async deactivateByMachine(licenseId: string, machineId: string): Promise<boolean> {
    const result = await db
      .update(activations)
      .set({ isActive: false })
      .where(and(eq(activations.licenseId, licenseId), eq(activations.machineId, machineId), eq(activations.isActive, true)))
      .returning();
    return result.length > 0;
  }

  async createAuditLog(data: { action: string; entityType: string; entityId?: string; userId?: string; details?: any; ipAddress?: string }): Promise<void> {
    await db.insert(auditLogs).values(data);
  }

  async getWebhooks(userId: string): Promise<Webhook[]> {
    return db.select().from(webhooks).where(eq(webhooks.userId, userId)).orderBy(desc(webhooks.createdAt));
  }

  async getWebhooksByEvent(userId: string, event: string): Promise<Webhook[]> {
    const allWebhooks = await db.select().from(webhooks).where(
      and(eq(webhooks.userId, userId), eq(webhooks.isActive, true))
    );
    return allWebhooks.filter(w => w.events.includes(event));
  }

  async createWebhook(data: InsertWebhook): Promise<Webhook> {
    const [webhook] = await db.insert(webhooks).values(data).returning();
    return webhook;
  }

  async deleteWebhook(id: string): Promise<void> {
    await db.delete(webhookDeliveries).where(eq(webhookDeliveries.webhookId, id));
    await db.delete(webhooks).where(eq(webhooks.id, id));
  }

  async updateWebhookLastTriggered(id: string): Promise<void> {
    await db.update(webhooks).set({ lastTriggeredAt: new Date() }).where(eq(webhooks.id, id));
  }

  async createWebhookDelivery(data: { webhookId: string; event: string; payload: any; statusCode?: number; response?: string; success: boolean }): Promise<void> {
    await db.insert(webhookDeliveries).values(data);
  }

  async getWebhookDeliveries(webhookId: string, limit: number = 20): Promise<WebhookDelivery[]> {
    return db.select().from(webhookDeliveries).where(eq(webhookDeliveries.webhookId, webhookId)).orderBy(desc(webhookDeliveries.createdAt)).limit(limit);
  }

  async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(notifications).where(
      and(eq(notifications.userId, userId), isNull(notifications.readAt))
    );
    return result?.count || 0;
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ readAt: new Date() }).where(
      and(eq(notifications.userId, userId), isNull(notifications.readAt))
    );
  }

  async getLicensesByEmail(email: string): Promise<(License & { productName?: string })[]> {
    const result = await db
      .select({
        id: licenses.id,
        licenseKey: licenses.licenseKey,
        productId: licenses.productId,
        userId: licenses.userId,
        customerName: licenses.customerName,
        customerEmail: licenses.customerEmail,
        type: licenses.type,
        status: licenses.status,
        maxActivations: licenses.maxActivations,
        currentActivations: licenses.currentActivations,
        allowedDomains: licenses.allowedDomains,
        expiresAt: licenses.expiresAt,
        metadata: licenses.metadata,
        createdAt: licenses.createdAt,
        updatedAt: licenses.updatedAt,
        productName: products.name,
      })
      .from(licenses)
      .leftJoin(products, eq(licenses.productId, products.id))
      .where(eq(licenses.customerEmail, email.toLowerCase()))
      .orderBy(desc(licenses.createdAt));
    return result as (License & { productName?: string })[];
  }

  async getDashboardStats(userId: string): Promise<any> {
    const userProducts = await db.select().from(products).where(eq(products.createdBy, userId));
    const productIds = userProducts.map((p) => p.id);

    let allLicenses: License[] = [];
    if (productIds.length > 0) {
      allLicenses = await db.select().from(licenses).where(eq(licenses.userId, userId)).orderBy(desc(licenses.createdAt));
    }

    const userApiKeys = await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));

    const totalActivations = allLicenses.reduce((sum, l) => sum + (l.currentActivations || 0), 0);

    const recentLicensesWithProduct = await db
      .select({
        id: licenses.id,
        licenseKey: licenses.licenseKey,
        productId: licenses.productId,
        userId: licenses.userId,
        customerName: licenses.customerName,
        customerEmail: licenses.customerEmail,
        type: licenses.type,
        status: licenses.status,
        maxActivations: licenses.maxActivations,
        currentActivations: licenses.currentActivations,
        expiresAt: licenses.expiresAt,
        metadata: licenses.metadata,
        createdAt: licenses.createdAt,
        updatedAt: licenses.updatedAt,
        productName: products.name,
      })
      .from(licenses)
      .leftJoin(products, eq(licenses.productId, products.id))
      .where(eq(licenses.userId, userId))
      .orderBy(desc(licenses.createdAt))
      .limit(5);

    return {
      totalProducts: userProducts.length,
      totalLicenses: allLicenses.length,
      activeLicenses: allLicenses.filter((l) => l.status === "active").length,
      totalApiKeys: userApiKeys.length,
      totalActivations,
      recentLicenses: recentLicensesWithProduct,
      recentProducts: userProducts.slice(0, 5),
    };
  }

  async getStatistics(userId: string): Promise<any> {
    const userProducts = await db.select().from(products).where(eq(products.createdBy, userId));
    const allLicenses = await db.select().from(licenses).where(eq(licenses.userId, userId));
    const userApiKeys = await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));

    const totalActivations = allLicenses.reduce((sum, l) => sum + (l.currentActivations || 0), 0);

    const licensesByType: Record<string, number> = {};
    const licensesByStatus: Record<string, number> = {};

    for (const l of allLicenses) {
      licensesByType[l.type] = (licensesByType[l.type] || 0) + 1;
      licensesByStatus[l.status] = (licensesByStatus[l.status] || 0) + 1;
    }

    const topProducts = userProducts.map((p) => ({
      name: p.name,
      licenses: allLicenses.filter((l) => l.productId === p.id).length,
    })).sort((a, b) => b.licenses - a.licenses).slice(0, 5);

    const licensesOverTime: Record<string, number> = {};
    for (const l of allLicenses) {
      if (l.createdAt) {
        const day = l.createdAt.toISOString().split("T")[0];
        licensesOverTime[day] = (licensesOverTime[day] || 0) + 1;
      }
    }

    const licenseIds = allLicenses.map(l => l.id);
    let allActivations: Activation[] = [];
    if (licenseIds.length > 0) {
      for (const lid of licenseIds) {
        const acts = await db.select().from(activations).where(eq(activations.licenseId, lid));
        allActivations.push(...acts);
      }
    }

    const activationsOverTime: Record<string, number> = {};
    for (const a of allActivations) {
      if (a.activatedAt) {
        const day = a.activatedAt.toISOString().split("T")[0];
        activationsOverTime[day] = (activationsOverTime[day] || 0) + 1;
      }
    }

    const sortedLicenseDates = Object.entries(licensesOverTime)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    const sortedActivationDates = Object.entries(activationsOverTime)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    return {
      totalProducts: userProducts.length,
      totalLicenses: allLicenses.length,
      activeLicenses: allLicenses.filter((l) => l.status === "active").length,
      revokedLicenses: allLicenses.filter((l) => l.status === "revoked").length,
      expiredLicenses: allLicenses.filter((l) => l.status === "expired").length,
      totalApiKeys: userApiKeys.length,
      totalActivations,
      licensesByType: Object.entries(licensesByType).map(([type, count]) => ({ type, count })),
      licensesByStatus: Object.entries(licensesByStatus).map(([status, count]) => ({ status, count })),
      topProducts,
      licensesOverTime: sortedLicenseDates,
      activationsOverTime: sortedActivationDates,
    };
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<void> {
    await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.userId, id));
    const userLicenses = await db.select().from(licenses).where(eq(licenses.userId, id));
    for (const lic of userLicenses) {
      await db.delete(activations).where(eq(activations.licenseId, lic.id));
    }
    await db.delete(licenses).where(eq(licenses.userId, id));
    await db.delete(products).where(eq(products.createdBy, id));
    await db.delete(notifications).where(eq(notifications.userId, id));
    await db.delete(webhooks).where(eq(webhooks.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  }

  async getAdminStats(): Promise<any> {
    const allUsers = await db.select().from(users);
    const allLicensesList = await db.select().from(licenses);
    const allProductsList = await db.select().from(products);
    const allApiKeysList = await db.select().from(apiKeys);
    const totalActivations = allLicensesList.reduce((sum, l) => sum + (l.currentActivations || 0), 0);

    return {
      totalUsers: allUsers.length,
      totalProducts: allProductsList.length,
      totalLicenses: allLicensesList.length,
      activeLicenses: allLicensesList.filter((l) => l.status === "active").length,
      revokedLicenses: allLicensesList.filter((l) => l.status === "revoked").length,
      expiredLicenses: allLicensesList.filter((l) => l.status === "expired").length,
      totalApiKeys: allApiKeysList.length,
      totalActivations,
      adminUsers: allUsers.filter((u) => u.role === "admin").length,
    };
  }

  async getAllLicenses(): Promise<(License & { productName?: string })[]> {
    const result = await db
      .select({
        id: licenses.id,
        licenseKey: licenses.licenseKey,
        productId: licenses.productId,
        userId: licenses.userId,
        customerName: licenses.customerName,
        customerEmail: licenses.customerEmail,
        type: licenses.type,
        status: licenses.status,
        maxActivations: licenses.maxActivations,
        currentActivations: licenses.currentActivations,
        allowedDomains: licenses.allowedDomains,
        expiresAt: licenses.expiresAt,
        metadata: licenses.metadata,
        createdAt: licenses.createdAt,
        updatedAt: licenses.updatedAt,
        productName: products.name,
      })
      .from(licenses)
      .leftJoin(products, eq(licenses.productId, products.id))
      .orderBy(desc(licenses.createdAt));
    return result as (License & { productName?: string })[];
  }

  async getAllProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getPlans(): Promise<Plan[]> {
    return db.select().from(plans).orderBy(plans.createdAt);
  }

  async getPlan(id: string): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan;
  }

  async createPlan(data: InsertPlan): Promise<Plan> {
    if (data.isDefault) {
      await db.update(plans).set({ isDefault: false }).where(eq(plans.isDefault, true));
    }
    const [plan] = await db.insert(plans).values(data).returning();
    return plan;
  }

  async updatePlan(id: string, data: Partial<InsertPlan>): Promise<Plan> {
    if (data.isDefault) {
      await db.update(plans).set({ isDefault: false }).where(eq(plans.isDefault, true));
    }
    const [plan] = await db.update(plans).set(data).where(eq(plans.id, id)).returning();
    return plan;
  }

  async deletePlan(id: string): Promise<void> {
    await db.update(users).set({ planId: null }).where(eq(users.planId, id));
    await db.delete(plans).where(eq(plans.id, id));
  }

  async getSettings(): Promise<PlatformSetting[]> {
    return db.select().from(platformSettings);
  }

  async getSetting(key: string): Promise<string | null> {
    const [setting] = await db.select().from(platformSettings).where(eq(platformSettings.key, key));
    return setting?.value ?? null;
  }

  async upsertSettings(settings: { key: string; value: string }[]): Promise<void> {
    for (const s of settings) {
      await db.insert(platformSettings)
        .values({ key: s.key, value: s.value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: platformSettings.key,
          set: { value: s.value, updatedAt: new Date() },
        });
    }
  }

  async updateUserPlan(userId: string, planId: string | null): Promise<void> {
    await db.update(users).set({ planId }).where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
