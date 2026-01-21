import { pgTable, uuid, integer, boolean, varchar, jsonb } from 'drizzle-orm/pg-core';

/**
 * Product Sections table schema
 */
export const productSectionsTable = pgTable('product_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name'),
  tags: jsonb('tags'),
  required: boolean('required'),
  discountSlot: integer('discount_slot'),
  max: integer('max'),
  min: integer('min'),
  quantity: integer('quantity'),
  isMultiple: boolean('is_multiple'),
  maxPerItem: integer('max_per_item'),
  visible: boolean('visible')
});

export type ProductSection = typeof productSectionsTable.$inferSelect;
export type NewProductSection = typeof productSectionsTable.$inferInsert;
