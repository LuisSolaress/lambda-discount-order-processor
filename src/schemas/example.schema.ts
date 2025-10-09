import { pgTable, serial, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';

/**
 * Example schema - Replace with your actual database tables
 */
export const exampleTable = pgTable('example_table', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ExampleTable = typeof exampleTable.$inferSelect;
export type NewExampleTable = typeof exampleTable.$inferInsert;
