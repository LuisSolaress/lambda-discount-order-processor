import { eq, inArray } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { itemsTable } from '../schemas/items.schema';
import { logger } from '../common';

/**
 * Servicio para obtener información de items
 */
export const getItemById = async (id: string) => {
  logger.info('[getItemById] Consultando item', { id });

  const db = await getDb();

  const items = await db
    .select()
    .from(itemsTable)
    .where(eq(itemsTable.id, id))
    .limit(1);

  if (items.length === 0) {
    logger.warn('[getItemById] Item no encontrado', { id });
    return null;
  }

  return items[0];
};

/**
 * Servicio para obtener múltiples items por sus IDs
 */
export const getItemsByIds = async (ids: string[]) => {
  logger.info('[getItemsByIds] Consultando items', { ids, count: ids.length });

  const db = await getDb();

  const items = await db
    .select()
    .from(itemsTable)
    .where(inArray(itemsTable.id, ids));

  logger.info('[getItemsByIds] Items encontrados', { count: items.length });

  return items;
};
