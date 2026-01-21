import { pgTable, uuid, integer, text, timestamp, jsonb, varchar, boolean } from 'drizzle-orm/pg-core';

/**
 * Order Workflow table schema
 * Almacena el historial de órdenes procesadas y enviadas al Core API
 */
export const orderWorkflowTable = pgTable('orderWorkflow', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('userId'),
  orden: varchar('orden'),
  tag: varchar('tag'),
  restaurante: varchar('restaurante'),
  totalOrden: varchar('total_orden'),
  formaVenta: varchar('forma_venta'),
  channel: varchar('channel'),
  orderJson: jsonb('order_json').notNull(),
  coreResponse: jsonb('core_response'),
  status: varchar('status'), // 'pending', 'sent', 'success', 'error'
  errorMessage: text('error_message'),
  sentToCore: boolean('sent_to_core').default(false),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).defaultNow().notNull()
});

export type OrderWorkflow = typeof orderWorkflowTable.$inferSelect;
export type NewOrderWorkflow = typeof orderWorkflowTable.$inferInsert;
