import { pgTable, integer, varchar, timestamp, jsonb, numeric, boolean, text, serial } from 'drizzle-orm/pg-core';

/**
 * Order table schema
 */
export const orderTable = pgTable('order', {
  id: serial('id').primaryKey(),
  contactName: varchar('contactName'),
  contactPhone: varchar('contactPhone'),
  invoiceName: varchar('invoiceName'),
  invoiceNit: varchar('invoiceNit'),
  deliveryAddress: varchar('deliveryAddress'),
  deliveryAddressObservation: varchar('deliveryAddressObservation'),
  point: jsonb('point'),
  restaurantId: integer('restaurantId'),
  paymentMethod: integer('paymentMethod'),
  cashAmount: numeric('cashAmount'),
  totalAmount: numeric('totalAmount'),
  userId: integer('userId'),
  status: varchar('status'),
  detailData: jsonb('detailData'),
  systemTraceNo: varchar('systemTraceNo'),
  authorizationCode: varchar('authorizationCode'),
  createdAt: timestamp('createdAt', { withTimezone: false }),
  observations: varchar('observations'),
  secondaryContactPhone: varchar('secondaryContactPhone'),
  paymentCardMethod: varchar('paymentCardMethod'),
  channel: varchar('channel'),
  timelapse: text('timelapse'),
  feeAmount: numeric('feeAmount'),
  dispatchedPoints: boolean('dispatchedPoints'),
});

export type Order = typeof orderTable.$inferSelect;
export type NewOrder = typeof orderTable.$inferInsert;
