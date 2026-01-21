import { pgTable, uuid, integer, boolean } from 'drizzle-orm/pg-core';

/**
 * Items by Sections table schema (relación entre items y secciones)
 */
export const itemsBySectionsTable = pgTable('items_by_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id'),
  sectionId: uuid('section_id'),
  selected: integer('selected'),
  quantity: integer('quantity'),
  position: integer('position'),
  isDefault: boolean('is_default')
});

export type ItemBySection = typeof itemsBySectionsTable.$inferSelect;
export type NewItemBySection = typeof itemsBySectionsTable.$inferInsert;
