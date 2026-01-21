import { pgTable, uuid, integer, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';

/**
 * Carts table schema
 */
export const cartsTable = pgTable('carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('userId'),
  couponId: integer('couponId'),
  promoId: integer('promoId'),
  sessionId: varchar('sessionId'),
  source: varchar('source'),
  product: jsonb('product'),
  createdAt: timestamp('createdAt', { withTimezone: false }).defaultNow().notNull(),
});

export type Cart = typeof cartsTable.$inferSelect;
export type NewCart = typeof cartsTable.$inferInsert;
