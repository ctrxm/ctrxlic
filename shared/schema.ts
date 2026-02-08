import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  version: text("version").default("1.0.0"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productRelations = relations(products, ({ many }) => ({
  licenses: many(licenses),
  apiKeys: many(apiKeys),
}));

export const licenses = pgTable("licenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  licenseKey: text("license_key").notNull().unique(),
  productId: varchar("product_id").notNull(),
  userId: varchar("user_id"),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  type: text("type").notNull().default("standard"),
  status: text("status").notNull().default("active"),
  maxActivations: integer("max_activations").default(1),
  currentActivations: integer("current_activations").default(0),
  allowedDomains: text("allowed_domains").array(),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_license_product").on(table.productId),
  index("idx_license_user").on(table.userId),
  index("idx_license_status").on(table.status),
]);

export const licenseRelations = relations(licenses, ({ one, many }) => ({
  product: one(products, { fields: [licenses.productId], references: [products.id] }),
  activations: many(activations),
}));

export const activations = pgTable("activations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  licenseId: varchar("license_id").notNull(),
  machineId: text("machine_id"),
  ipAddress: text("ip_address"),
  hostname: text("hostname"),
  activatedAt: timestamp("activated_at").defaultNow(),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const activationRelations = relations(activations, ({ one }) => ({
  license: one(licenses, { fields: [activations.licenseId], references: [licenses.id] }),
}));

export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  productId: varchar("product_id"),
  userId: varchar("user_id"),
  permissions: text("permissions").array().default(sql`ARRAY['validate']::text[]`),
  isActive: boolean("is_active").default(true),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const apiKeyRelations = relations(apiKeys, ({ one }) => ({
  product: one(products, { fields: [apiKeys.productId], references: [products.id] }),
}));

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id"),
  userId: varchar("user_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_audit_action").on(table.action),
  index("idx_audit_entity").on(table.entityType, table.entityId),
]);

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLicenseSchema = createInsertSchema(licenses).omit({ id: true, licenseKey: true, currentActivations: true, createdAt: true, updatedAt: true });
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, key: true, lastUsedAt: true, createdAt: true });
export const insertActivationSchema = createInsertSchema(activations).omit({ id: true, activatedAt: true, lastSeenAt: true });

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type License = typeof licenses.$inferSelect;
export type InsertActivation = z.infer<typeof insertActivationSchema>;
export type Activation = typeof activations.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
