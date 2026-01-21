import { relations } from 'drizzle-orm';
import { cartsTable } from './carts.schema';
import { promosTable } from './promos.schema';
import { couponsTable } from './coupons.schema';

/**
 * Relaciones de la tabla carts
 */
export const cartsRelations = relations(cartsTable, ({ one }) => ({
  promo: one(promosTable, {
    fields: [cartsTable.promoId],
    references: [promosTable.id],
  }),
  coupon: one(couponsTable, {
    fields: [cartsTable.couponId],
    references: [couponsTable.id],
  }),
}));

/**
 * Relaciones de la tabla promos
 */
export const promosRelations = relations(promosTable, ({ many }) => ({
  carts: many(cartsTable),
}));

/**
 * Relaciones de la tabla coupons
 */
export const couponsRelations = relations(couponsTable, ({ many }) => ({
  carts: many(cartsTable),
}));
