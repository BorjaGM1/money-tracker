import { sqliteTable, text, integer, real, unique } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Income sources (Job, TC, Elevate, YouTube, etc.)
export const earningSources = sqliteTable("earning_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  color: text("color"),
  icon: text("icon"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Bank/asset accounts (OpenBank, Cajamar, Mercury, Cash, etc.)
export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").default("bank"), // "bank", "investment", "crypto", "cash"
  currency: text("currency").default("EUR"),
  color: text("color"),
  icon: text("icon"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Individual earning entries (transaction-based)
// Can have multiple entries from same source on same day
// Each entry has its own date and currency
export const earnings = sqliteTable("earnings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceId: integer("source_id").notNull().references(() => earningSources.id),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("EUR"),
  date: text("date").notNull(), // ISO date: "2024-11-15"
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Account balances at day 1 of each month (snapshot)
// Standalone - not tied to a monthly record
export const monthlyBalances = sqliteTable("monthly_balances", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  accountId: integer("account_id").notNull().references(() => accounts.id),
  amount: real("amount").notNull().default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  uniqueYearMonthAccount: unique().on(table.year, table.month, table.accountId),
}));

// Cached exchange rates from API
// Base currency is always EUR, rates show how much 1 EUR = X of target
export const exchangeRates = sqliteTable("exchange_rates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  currency: text("currency").notNull().unique(), // "USD", "GBP", etc.
  rate: real("rate").notNull(), // 1 EUR = X currency
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Spending categories with optional parent for 2-level hierarchy
export const spendingCategories = sqliteTable("spending_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  parentId: integer("parent_id"),
  color: text("color"),
  icon: text("icon"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Individual spending entries (mirrors earnings table)
export const spending = sqliteTable("spending", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id").notNull().references(() => spendingCategories.id),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("EUR"),
  date: text("date").notNull(), // ISO date: "2024-11-15"
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// App settings (key-value store)
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// Types
export type EarningSource = typeof earningSources.$inferSelect;
export type NewEarningSource = typeof earningSources.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Earning = typeof earnings.$inferSelect;
export type NewEarning = typeof earnings.$inferInsert;

export type MonthlyBalance = typeof monthlyBalances.$inferSelect;
export type NewMonthlyBalance = typeof monthlyBalances.$inferInsert;

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type NewExchangeRate = typeof exchangeRates.$inferInsert;

export type SpendingCategory = typeof spendingCategories.$inferSelect;
export type NewSpendingCategory = typeof spendingCategories.$inferInsert;

export type Spending = typeof spending.$inferSelect;
export type NewSpending = typeof spending.$inferInsert;

export type Setting = typeof settings.$inferSelect;
