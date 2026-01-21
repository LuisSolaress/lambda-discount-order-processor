import { eq } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { cartsTable, couponsTable, promosTable } from '../schemas';
import { logger } from '../common';
import { CartRequestDto } from '../dto/cart-request.dto';

/**
 * Servicio para consultar carritos por userId o sessionId
 * Incluye información de coupons y promos mediante leftJoin
 */
export const getCartService = async (data: CartRequestDto) => {
  logger.info('[getCartService] Consultando carrito', { data });

  const db = await getDb();

  let carts;

  // Validar cuál parámetro está presente y hacer el query correspondiente
  if (data.userId) {
    logger.info('[getCartService] Buscando por userId', { userId: data.userId });
    carts = await db
      .select()
      .from(cartsTable)
      .leftJoin(couponsTable, eq(cartsTable.couponId, couponsTable.id))
      .leftJoin(promosTable, eq(cartsTable.promoId, promosTable.id))
      .where(eq(cartsTable.userId, data.userId));
  } else if (data.sessionId) {
    logger.info('[getCartService] Buscando por sessionId', { sessionId: data.sessionId });
    carts = await db
      .select()
      .from(cartsTable)
      .leftJoin(couponsTable, eq(cartsTable.couponId, couponsTable.id))
      .leftJoin(promosTable, eq(cartsTable.promoId, promosTable.id))
      .where(eq(cartsTable.sessionId, data.sessionId));
  } else {
    // Este caso no debería ocurrir por la validación previa
    throw new Error('userId o sessionId es requerido');
  }

  logger.info('[getCartService] Carritos encontrados', { count: carts.length });

  return carts;
};
