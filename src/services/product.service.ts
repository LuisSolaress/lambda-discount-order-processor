import { eq, inArray } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { productTable } from '../schemas/product.schema';
import { logger } from '../common';

/**
 * Servicio para obtener información de productos
 */
export const getProductByOldId = async (oldId: number) => {
  logger.info('[getProductByOldId] Consultando producto', { oldId });

  const db = await getDb();

  const products = await db
    .select()
    .from(productTable)
    .where(eq(productTable.productId, oldId))
    .limit(1);

  if (products.length === 0) {
    logger.warn('[getProductByOldId] Producto no encontrado', { oldId });
    return null;
  }

  return products[0];
};

/**
 * Servicio para obtener múltiples productos por sus oldIds
 */
export const getProductsByOldIds = async (oldIds: number[]) => {
  logger.info('[getProductsByOldIds] Consultando productos', { oldIds, count: oldIds.length });

  const db = await getDb();

  const products = await db
    .select()
    .from(productTable)
    .where(inArray(productTable.productId, oldIds));

  logger.info('[getProductsByOldIds] Productos encontrados', { count: products.length });

  return products;
};
