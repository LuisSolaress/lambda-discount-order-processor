import { pgTable, uuid, integer, text, numeric, boolean, varchar, char } from 'drizzle-orm/pg-core';

/**
 * Items table schema
 */
export const itemsTable = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  plu: integer('plu'),
  price: numeric('price'),
  enabled: boolean('enabled'),
  size: char('size'),
  coreGroup: varchar('core_group'),
  coreType: varchar('core_type'),
  name: varchar('name'),
  modifiers: char('modifiers'),
  coreDescription: text('core_description')
});

export type Item = typeof itemsTable.$inferSelect;
export type NewItem = typeof itemsTable.$inferInsert;
