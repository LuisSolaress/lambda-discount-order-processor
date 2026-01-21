import { pgTable, uuid, integer, numeric, boolean, varchar, jsonb } from 'drizzle-orm/pg-core';

/**
 * Products table schema
 */
export const productsTable = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  oldId: integer('old_id'),
  name: varchar('name'),
  image: varchar('image'),
  price: numeric('price'),
  enabled: boolean('enabled'),
  visible: boolean('visible'),
  tags: jsonb('tags')
});

export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;
