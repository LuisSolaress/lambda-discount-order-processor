import { pgTable, integer, boolean, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';

/**
 * Promos table schema
 */
export const promosTable = pgTable('promos', {
  id: integer('id').primaryKey(),
  name: varchar('name'),
  title: varchar('title'),
  description: varchar('description'),
  code: varchar('code'),
  type: varchar('type'),
  generationType: varchar('generationType'),
  imageUrl: varchar('imageUrl'),
  humanReadableRules: varchar('humanReadableRules'),
  promoPlu: integer('promoPlu'),
  priority: integer('priority'),
  enabled: boolean('enabled'),
  visible: boolean('visible'),
  rules: jsonb('rules'),
  createdAt: timestamp('createdAt', { withTimezone: false })
});

export type Promo = typeof promosTable.$inferSelect;
export type NewPromo = typeof promosTable.$inferInsert;
