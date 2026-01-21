import { pgTable, integer, numeric, boolean, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

/**
 * Product table schema
 */
export const productTable = pgTable('product', {
  productId: integer('productId').primaryKey(),
  name: text('name'),
  coreName: text('coreName'),
  description: text('description'),
  type: text('type'),
  availability: text('availability'),
  plu: integer('plu'),
  price: numeric('price'),
  newPrice: numeric('newPrice'),
  priority: integer('priority'),
  status: integer('status'),
  smallImage: text('smallImage'),
  bigImage: text('bigImage'),
  listed: boolean('listed'),
  promo: boolean('promo'),
  new: boolean('new'),
  variations: jsonb('variations'),
  expirationDate: timestamp('expirationDate', { withTimezone: false })
});

export type ProductSingular = typeof productTable.$inferSelect;
export type NewProductSingular = typeof productTable.$inferInsert;
