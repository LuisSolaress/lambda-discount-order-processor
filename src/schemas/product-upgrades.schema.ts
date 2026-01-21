import { pgTable, integer } from 'drizzle-orm/pg-core';

/**
 * Product Upgrades table schema
 */
export const productUpgradesTable = pgTable('productUpgrades', {
  id: integer('id').primaryKey(),
  baseProductId: integer('baseProductId').notNull(),
  upgradedProductId: integer('upgradedProductId').notNull(),
});

export type ProductUpgrade = typeof productUpgradesTable.$inferSelect;
export type NewProductUpgrade = typeof productUpgradesTable.$inferInsert;
