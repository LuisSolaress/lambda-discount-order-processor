import { pgTable, integer, boolean, varchar, timestamp } from 'drizzle-orm/pg-core';

/**
 * Coupons table schema
 */
export const couponsTable = pgTable('coupons', {
  id: integer('id').primaryKey(),
  promoId: integer('promoId'),
  code: varchar('code'),
  type: varchar('type'),
  enabled: boolean('enabled'),
  createdAt: timestamp('createdAt', { withTimezone: false }),
  redeemedAt: timestamp('redeemedAt', { withTimezone: false }),
});

export type Coupon = typeof couponsTable.$inferSelect;
export type NewCoupon = typeof couponsTable.$inferInsert;
