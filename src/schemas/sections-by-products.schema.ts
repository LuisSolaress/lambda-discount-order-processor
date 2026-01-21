import { pgTable, uuid, integer } from 'drizzle-orm/pg-core';

/**
 * Sections by Products table schema (relación entre productos y secciones)
 */
export const sectionsByProductsTable = pgTable('sections_by_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id'),
  sectionId: uuid('section_id'),
  position: integer('position')
});

export type SectionByProduct = typeof sectionsByProductsTable.$inferSelect;
export type NewSectionByProduct = typeof sectionsByProductsTable.$inferInsert;
