import { inArray, sql } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { productTable } from '../schemas/product.schema';
import { logger } from '../common';
import { GetDiscountPriceByPluDto } from '../dto/discount-price-plu.dto';

/**
 * Interfaz para el resultado del procedimiento almacenado get_discount_price_by_plu
 */
export interface StoredProcedureDiscountResult {
  discount_price: string;
  discount_code: number;
  cluster: string;
  plu1: number | null;
  plu2: number | null;
  plu3: number | null;
  plu4: number | null;
  plu5: number | null;
  plu1DiscountPrice: string | null;
  plu2DiscountPrice: string | null;
  plu3DiscountPrice: string | null;
  plu4DiscountPrice: string | null;
  plu5DiscountPrice: string | null;
}

/**
 * Interfaz para el resultado de un producto con descuento
 */
export interface ProductDiscountInfo {
  plu: number;
  name: string;
  originalPrice: string;
  discountedPrice: string;
  discount: string;
}

/**
 * Interfaz para el resultado completo
 */
export interface DiscountPriceResult {
  products: ProductDiscountInfo[];
  totalOriginalPrice: string;
  totalDiscountedPrice: string;
  totalDiscount: string;
}

/**
 * Obtiene el precio con descuento para productos por sus PLUs
 * @param request - DTO con hasta 5 PLUs opcionales
 * @returns Información de precios con descuento
 */
export const getDiscountPriceByPlu = async (
  request: GetDiscountPriceByPluDto
): Promise<DiscountPriceResult> => {
  logger.info('[getDiscountPriceByPlu] Consultando precios con descuento', { request });

  // Recolectar los PLUs que no son undefined
  const plusToQuery: number[] = [];
  if (request.plu1 !== undefined) plusToQuery.push(request.plu1);
  if (request.plu2 !== undefined) plusToQuery.push(request.plu2);
  if (request.plu3 !== undefined) plusToQuery.push(request.plu3);
  if (request.plu4 !== undefined) plusToQuery.push(request.plu4);
  if (request.plu5 !== undefined) plusToQuery.push(request.plu5);

  // Si no hay PLUs, retornar resultado vacío
  if (plusToQuery.length === 0) {
    logger.warn('[getDiscountPriceByPlu] No se proporcionaron PLUs');
    return {
      products: [],
      totalOriginalPrice: '0.00',
      totalDiscountedPrice: '0.00',
      totalDiscount: '0.00',
    };
  }

  const db = await getDb();

  // Buscar productos por PLUs
  const products = await db
    .select()
    .from(productTable)
    .where(inArray(productTable.plu, plusToQuery));

  if (products.length === 0) {
    logger.warn('[getDiscountPriceByPlu] No se encontraron productos con los PLUs proporcionados', {
      plusToQuery,
    });
    return {
      products: [],
      totalOriginalPrice: '0.00',
      totalDiscountedPrice: '0.00',
      totalDiscount: '0.00',
    };
  }

  // Calcular descuentos para cada producto
  const productsWithDiscount: ProductDiscountInfo[] = [];
  let totalOriginal = 0;
  let totalDiscounted = 0;

  for (const product of products) {
    const originalPrice = parseFloat(product.price?.toString() || '0');
    
    // Calcular el descuento (ejemplo: 15% de descuento)
    const discountPercentage = 15;
    const discount = originalPrice * (discountPercentage / 100);
    const discountedPrice = originalPrice - discount;

    totalOriginal += originalPrice;
    totalDiscounted += discountedPrice;

    productsWithDiscount.push({
      plu: product.plu || 0,
      name: product.name || '',
      originalPrice: originalPrice.toFixed(2),
      discountedPrice: discountedPrice.toFixed(2),
      discount: discount.toFixed(2),
    });
  }

  const totalDiscount = totalOriginal - totalDiscounted;

  logger.info('[getDiscountPriceByPlu] Precios calculados', {
    productsFound: products.length,
    totalOriginal,
    totalDiscounted,
    totalDiscount,
  });

  return {
    products: productsWithDiscount,
    totalOriginalPrice: totalOriginal.toFixed(2),
    totalDiscountedPrice: totalDiscounted.toFixed(2),
    totalDiscount: totalDiscount.toFixed(2),
  };
};

/**
 * Consulta el procedimiento almacenado get_discount_price_by_plu
 * @param request - DTO con hasta 5 PLUs opcionales y cluster opcional
 * @returns Resultado del procedimiento almacenado con precios de descuento calculados
 * 
 * Lógica de prioridad de cluster:
 * 1. Si request.cluster existe, busca primero CLUSTER{cluster} (ej: CLUSTER03)
 * 2. Si no encuentra, busca DELIVERY
 * 3. Si no encuentra ninguno, retorna null (plan de contingencia)
 */
export const getDiscountPriceByPluStoredProcedure = async (
  request: GetDiscountPriceByPluDto
): Promise<StoredProcedureDiscountResult | null> => {
  logger.info('[getDiscountPriceByPluStoredProcedure] Consultando procedimiento almacenado', { request });

  const db = await getDb();

  const plu1 = request.plu1 ?? null;
  const plu2 = request.plu2 ?? null;
  const plu3 = request.plu3 ?? null;
  const plu4 = request.plu4 ?? null;
  const plu5 = request.plu5 ?? null;

  try {
    const result = await db.execute(
      sql`SELECT * FROM get_discount_price_by_plu(${plu1}, ${plu2}, ${plu3}, ${plu4}, ${plu5})`
    );

    if (!result || result.length === 0) {
      logger.warn('[getDiscountPriceByPluStoredProcedure] No se encontró descuento para los PLUs proporcionados', {
        request,
      });
      return null;
    }

    const allResults = result as unknown as StoredProcedureDiscountResult[];

    // Aplicar lógica de prioridad de cluster
    let discountData: StoredProcedureDiscountResult | null = null;

    if (request.cluster) {
      // 1. Buscar primero por CLUSTER{cluster} (ej: CLUSTER03)
      const clusterTarget = `CLUSTER${request.cluster}`;
      discountData = allResults.find(r => r.cluster === clusterTarget) || null;

      if (discountData) {
        logger.info('[getDiscountPriceByPluStoredProcedure] Descuento encontrado para cluster específico', {
          clusterTarget,
          discountCode: discountData.discount_code,
          discountPrice: discountData.discount_price,
        });
        return discountData;
      }

      logger.info('[getDiscountPriceByPluStoredProcedure] No se encontró descuento para cluster específico, buscando DELIVERY', {
        clusterTarget,
      });
    }

    // 2. Buscar por DELIVERY (fallback o si no hay cluster en request)
    discountData = allResults.find(r => r.cluster === 'DELIVERY') || null;

    if (discountData) {
      logger.info('[getDiscountPriceByPluStoredProcedure] Descuento encontrado para DELIVERY', {
        discountCode: discountData.discount_code,
        discountPrice: discountData.discount_price,
      });
      return discountData;
    }

    // 3. No se encontró ningún descuento válido
    logger.warn('[getDiscountPriceByPluStoredProcedure] No se encontró descuento ni para cluster específico ni para DELIVERY', {
      request,
      availableClusters: allResults.map(r => r.cluster),
    });

    return null;
  } catch (error) {
    logger.error('[getDiscountPriceByPluStoredProcedure] Error al consultar procedimiento almacenado', {
      error,
      request,
    });
    throw error;
  }
};
