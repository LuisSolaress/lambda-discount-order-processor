import { logger } from '../common';
import { Cart } from '../schemas/carts.schema';
import { getProductByOldId } from './product.service';
import { getItemsByIds } from './item.service';
import { DetalleProductoDto, ModificadorOpcionDto, MixtoOpcionDto } from '../dto/order-request.dto';
import { getDiscountPriceByPluStoredProcedure } from './discount-price.service';

// Normaliza el grupo de mixto para que coincida con los códigos esperados por el Core
const mapMixtoGroup = (coreGroup?: string | null): string => {
  if (!coreGroup) return 'OTR';

  const g = coreGroup.toUpperCase();

  switch (g) {
    case 'FRITOS':
      return 'FRI';
    case 'BEBIDAS':
      return 'BEB';
    case 'POSTRES':
      return 'POS';
    case 'SANDWICH':
      return 'SDW';
    case 'PREMIUM':
      return 'OTR';
    default:
      // Fallback: usar los primeros 3 caracteres como código
      return g.substring(0, 3);
  }
};

/**
 * Interface para el producto en el cart
 */
interface CartProduct {
  name: string;
  qty: string;
  oldId: string;
  id: string;
  sections?: CartSection[];
  // Algunos flujos de carrito envían los items planos sin sections
  items?: CartSectionItem[];
}

interface CartSection {
  id?: string;
  sectionId?: string;
  items: CartSectionItem[];
}

interface CartSectionItem {
  qty: string;
  id: string;
  type?: string;
}

/**
 * Construye el detalle de un producto individual desde el cart
 */
export const buildIndividualProductDetail = async (
  cartItem: Cart,
  lineNumber: number,
  cluster?: string
): Promise<DetalleProductoDto | null> => {
  try {
    const cartProduct = cartItem.product as CartProduct;
    
    if (!cartProduct || !cartProduct.oldId) {
      logger.warn('[buildIndividualProductDetail] Producto sin oldId', { cartItem });
      return null;
    }

    // Obtener información del producto desde la tabla product
    logger.info('[buildIndividualProductDetail] OldId recibido', { oldId: cartProduct.oldId });
    logger.debug('[buildIndividualProductDetail] cartProduct', { cartProduct });
    const productInfo = await getProductByOldId(parseInt(cartProduct.oldId));

    if (!productInfo) {
      logger.error('[buildIndividualProductDetail] Producto no encontrado en DB', { 
        oldId: cartProduct.oldId 
      });
      return null;
    }

    // Calcular el monto (precio * cantidad)
    const cantidad = parseInt(cartProduct.qty || '1');
    const precio = parseFloat(productInfo.price?.toString() || '0');
    const monto = (precio * cantidad).toFixed(2);

    // Construir el detalle del producto
    const detalle: DetalleProductoDto = {
      linea_detalle: lineNumber.toString(),
      plu: productInfo.plu?.toString() || cartProduct.oldId,
      cantidad: cantidad.toString(),
      descripcion: productInfo.coreName || productInfo.name || cartProduct.name,
      monto: monto,
      tipo: 'NORMAL',
      modificadores: 'N',
      mixto_opciones: [],
      source: cartItem.source || 'menu'
    };

    logger.info('[buildIndividualProductDetail] Detalle construido', { 
      oldId: cartProduct.oldId,
      plu: detalle.plu,
      descripcion: detalle.descripcion 
    });

    return detalle;
  } catch (error) {
    logger.error('[buildIndividualProductDetail] Error construyendo detalle', { 
      error,
      cartItem 
    });
    return null;
  }
};

/**
 * Construye los detalles de un producto COMBO desde el cart
 * Devuelve múltiples líneas: una para el combo y una por cada item de las sections
 */
export const buildComboProductDetail = async (
  cartItem: Cart,
  lineNumber: number,
  cluster?: string
): Promise<DetalleProductoDto[]> => {
  const detalles: DetalleProductoDto[] = [];

  try {
    const cartProduct = cartItem.product as CartProduct;
    
    if (!cartProduct || !cartProduct.oldId) {
      logger.warn('[buildComboProductDetail] Producto sin oldId', { cartItem });
      return detalles;
    }

    // Obtener información del producto desde la tabla product
    logger.info('[buildComboProductDetail] OldId recibido', { oldId: cartProduct.oldId });
    logger.debug('[buildComboProductDetail] cartProduct', { cartProduct });
    const productInfo = await getProductByOldId(parseInt(cartProduct.oldId));

    if (!productInfo) {
      logger.error('[buildComboProductDetail] Producto no encontrado en DB', { 
        oldId: cartProduct.oldId 
      });
      return detalles;
    }

    // Calcular el monto (precio * cantidad) del combo principal
    const cantidad = parseInt(cartProduct.qty || '1');
    let precio = parseFloat(productInfo.price?.toString() || '0');

    // Consultar items de sections si existen (para cálculo de descuentos y construcción de detalles)
    if (cartProduct.sections && cartProduct.sections.length > 0) {
      // Recolectar todos los IDs de items de todas las secciones
      const allItemIds: string[] = [];
      for (const section of cartProduct.sections) {
        for (const item of section.items) {
          allItemIds.push(item.id);
        }
      }

      if (allItemIds.length > 0) {
        const itemsInfo = await getItemsByIds(allItemIds);
        const itemsMap = new Map(itemsInfo.map(item => [item.id, item]));

        // Preparar PLUs para llamar al procedimiento almacenado de descuentos
        let pluSDW: number | undefined;
        let pluFRI: number | undefined;
        let pluBEB: number | undefined;
        let pluOTR: number | undefined;

        // Buscar los PLUs según el type de cada item en sections
        for (const section of cartProduct.sections) {
          for (const sectionItem of section.items) {
            const itemInfo = itemsMap.get(sectionItem.id);
            
            if (itemInfo && itemInfo.plu && sectionItem.type) {
              const itemType = sectionItem.type.toUpperCase();
              
              if (itemType === 'SDW') {
                pluSDW = itemInfo.plu;
              } else if (itemType === 'FRI') {
                pluFRI = itemInfo.plu;
              } else if (itemType === 'BEB') {
                pluBEB = itemInfo.plu;
              } else if (itemType === 'OTR' || itemType === 'POS') {
                pluOTR = itemInfo.plu;
              }
            }
          }
        }

        logger.info('[buildComboProductDetail] PLUs identificados para descuento', {
          pluSDW,
          pluFRI,
          pluBEB,
          pluOTR
        });

        // Llamar al procedimiento almacenado si tenemos al menos un PLU
        let discountResult = null;
        if (pluSDW || pluFRI || pluBEB || pluOTR) {
          try {
            discountResult = await getDiscountPriceByPluStoredProcedure({
              plu1: undefined, // Primer valor siempre NULL para combos
              plu2: pluSDW,    // Segundo valor: SDW
              plu3: pluFRI,    // Tercer valor: FRI
              plu4: pluBEB,    // Cuarto valor: BEB
              plu5: pluOTR,    // Quinto valor: OTR o POS
              cluster: cluster, // Cluster del request body (opcional)
            });

            if (discountResult && discountResult.discount_price) {
              logger.info('[buildComboProductDetail] Descuento encontrado para combo', {
                discountPrice: discountResult.discount_price,
                discountCode: discountResult.discount_code,
                cluster: discountResult.cluster,
                plu2DiscountPrice: discountResult.plu2DiscountPrice,
                plu3DiscountPrice: discountResult.plu3DiscountPrice,
                plu4DiscountPrice: discountResult.plu4DiscountPrice,
                plu5DiscountPrice: discountResult.plu5DiscountPrice
              });
            } else {
              logger.info('[buildComboProductDetail] No se encontró descuento para este combo');
            }
          } catch (error) {
            logger.error('[buildComboProductDetail] Error al consultar descuento', {
              error,
              pluSDW,
              pluFRI,
              pluBEB,
              pluOTR
            });
          }
        }

        // Calcular monto de la línea principal del combo (SDW + FRI)
        let montoCombo = 0;
        if (discountResult) {
          // Usar precios de descuento individuales
          const plu2Price = discountResult.plu2DiscountPrice ? parseFloat(discountResult.plu2DiscountPrice) : 0;
          const plu3Price = discountResult.plu3DiscountPrice ? parseFloat(discountResult.plu3DiscountPrice) : 0;
          montoCombo = (plu2Price + plu3Price) * cantidad;
        } else {
          // Sin descuento, usar precio original
          montoCombo = precio * cantidad;
        }

        // 1) Línea principal del combo (SDW + FRI)
        detalles.push({
          linea_detalle: lineNumber.toString(),
          plu: productInfo.plu?.toString() || cartProduct.oldId,
          cantidad: cantidad.toString(),
          descripcion: productInfo.coreName || productInfo.name || cartProduct.name,
          monto: montoCombo.toFixed(2),
          tipo: 'NORMAL',
          modificadores: 'N',
          mixto_opciones: [],
          source: cartItem.source || 'menu'
        });

        // 2) Líneas adicionales por cada item de las sections
        // IMPORTANTE: Omitir SDW y FRI ya que están incluidos en la línea principal del combo
        let currentLine = lineNumber + 1;

        for (const section of cartProduct.sections) {
          for (const sectionItem of section.items) {
            const itemInfo = itemsMap.get(sectionItem.id);

            if (itemInfo && itemInfo.coreDescription && sectionItem.type) {
              const itemType = sectionItem.type.toUpperCase();
              
              // Omitir SDW y FRI - ya están incluidos en la línea principal del combo
              if (itemType === 'SDW' || itemType === 'FRI') {
                logger.debug('[buildComboProductDetail] Omitiendo item SDW/FRI de líneas adicionales', {
                  itemId: sectionItem.id,
                  type: itemType,
                  descripcion: itemInfo.coreDescription
                });
                continue;
              }

              const itemCantidad = parseInt(sectionItem.qty || '1');
              let itemMonto = 0;

              // Determinar el monto según el tipo y si hay descuento
              if (discountResult) {
                if (itemType === 'BEB' && discountResult.plu4DiscountPrice) {
                  itemMonto = parseFloat(discountResult.plu4DiscountPrice) * cantidad;
                } else if ((itemType === 'OTR' || itemType === 'POS') && discountResult.plu5DiscountPrice) {
                  itemMonto = parseFloat(discountResult.plu5DiscountPrice) * cantidad;
                } else {
                  // Si no hay precio de descuento para este tipo, usar precio original
                  const itemPrecio = parseFloat(itemInfo.price?.toString() || '0');
                  itemMonto = itemPrecio * itemCantidad;
                }
              } else {
                // Sin descuento: las líneas adicionales tienen monto 0 porque están incluidas en el precio del combo
                itemMonto = 0;
                logger.debug('[buildComboProductDetail] Sin descuento - monto 0 para item adicional', {
                  itemId: sectionItem.id,
                  type: itemType,
                  descripcion: itemInfo.coreDescription
                });
              }

              detalles.push({
                linea_detalle: currentLine.toString(),
                plu: itemInfo.plu?.toString() || '',
                cantidad: sectionItem.qty,
                descripcion: itemInfo.coreDescription,
                monto: itemMonto.toFixed(2),
                tipo: 'NORMAL',
                modificadores: 'N',
                mixto_opciones: [],
                source: cartItem.source || 'menu'
              });

              currentLine++;
            }
          }
        }
      }
    } else {
      // Si no hay sections, crear solo la línea principal del combo sin descuento
      const monto = (precio * cantidad).toFixed(2);
      
      detalles.push({
        linea_detalle: lineNumber.toString(),
        plu: productInfo.plu?.toString() || cartProduct.oldId,
        cantidad: cantidad.toString(),
        descripcion: productInfo.coreName || productInfo.name || cartProduct.name,
        monto: monto,
        tipo: 'NORMAL',
        modificadores: 'N',
        mixto_opciones: [],
        source: cartItem.source || 'menu'
      });
    }

    logger.info('[buildComboProductDetail] Detalles construidos', { 
      oldId: cartProduct.oldId,
      lineas: detalles.length
    });

    return detalles;
  } catch (error) {
    logger.error('[buildComboProductDetail] Error construyendo detalles COMBO', { 
      error,
      cartItem 
    });
    return detalles;
  }
};

/**
 * Construye el detalle de un producto MIXTO desde el cart
 */
export const buildMixtoProductDetail = async (
  cartItem: Cart,
  lineNumber: number,
  cluster?: string
): Promise<DetalleProductoDto | null> => {
  try {
    const cartProduct = cartItem.product as CartProduct;
    
    if (!cartProduct || !cartProduct.oldId) {
      logger.warn('[buildMixtoProductDetail] Producto sin oldId', { cartItem });
      return null;
    }

    // Obtener información del producto desde la tabla product
    logger.info('[buildMixtoProductDetail] OldId recibido', { oldId: cartProduct.oldId });
    logger.debug('[buildMixtoProductDetail] cartProduct', { cartProduct });
    const productInfo = await getProductByOldId(parseInt(cartProduct.oldId));

    if (!productInfo) {
      logger.error('[buildMixtoProductDetail] Producto no encontrado en DB', { 
        oldId: cartProduct.oldId 
      });
      return null;
    }

    // Calcular el monto (precio * cantidad)
    const cantidad = parseInt(cartProduct.qty || '1');
    let precio = parseFloat(productInfo.price?.toString() || '0');

    // Intentar obtener descuento para producto MIXTO
    let discountResult = null;
    if (productInfo.plu) {
      try {
        logger.info('[buildMixtoProductDetail] Consultando descuento para producto MIXTO', {
          plu1: productInfo.plu,
          cluster: cluster
        });

        discountResult = await getDiscountPriceByPluStoredProcedure({
          plu1: productInfo.plu, // PLU del producto principal
          plu2: undefined,
          plu3: undefined,
          plu4: undefined,
          plu5: undefined,
          cluster: cluster, // Cluster del request body (opcional)
        });

        if (discountResult && discountResult.discount_price) {
          const discountPrice = parseFloat(discountResult.discount_price);
          logger.info('[buildMixtoProductDetail] Descuento encontrado para producto MIXTO', {
            precioOriginal: precio,
            precioConDescuento: discountPrice,
            discountCode: discountResult.discount_code,
            cluster: discountResult.cluster,
            plu1DiscountPrice: discountResult.plu1DiscountPrice
          });
          
          // Actualizar el precio con el descuento
          precio = discountPrice;
        } else {
          logger.info('[buildMixtoProductDetail] No se encontró descuento para este producto MIXTO');
        }
      } catch (error) {
        logger.error('[buildMixtoProductDetail] Error al consultar descuento', {
          error,
          plu1: productInfo.plu
        });
      }
    }

    const monto = (precio * cantidad).toFixed(2);

    // Construir mixto_opciones desde las sections o, si no existen,
    // desde un arreglo plano de items en cartProduct.items
    const mixtoOpciones: MixtoOpcionDto[] = [];

    // Determinar la fuente de sections
    let sections: CartSection[] | null = null;
    if (cartProduct.sections && cartProduct.sections.length > 0) {
      sections = cartProduct.sections;
    } else if (cartProduct.items && cartProduct.items.length > 0) {
      // Adaptar items planos a una sola sección lógica
      sections = [
        {
          sectionId: 'default',
          items: cartProduct.items,
        },
      ];
    }

    if (sections && sections.length > 0) {
      // Recolectar todos los IDs de items de todas las secciones
      const allItemIds: string[] = [];
      for (const section of sections) {
        for (const item of section.items) {
          allItemIds.push(item.id);
        }
      }

      // Obtener información de todos los items
      const itemsInfo = await getItemsByIds(allItemIds);
      const itemsMap = new Map(itemsInfo.map(item => [item.id, item]));

      // Construir mixto_opciones desde las sections
      for (const section of sections) {
        for (const sectionItem of section.items) {
          const itemInfo = itemsMap.get(sectionItem.id);

          if (itemInfo && itemInfo.coreDescription) {
            mixtoOpciones.push({
              mixto_opcion: mapMixtoGroup(itemInfo.coreGroup),
              mixto_cantidad: String(sectionItem.qty ?? ''),
              mixto_plu: itemInfo.plu?.toString() || '',
              mixto_descripcion: itemInfo.coreDescription,
            });
          }
        }
      }
    }

    // Construir el detalle del producto
    const detalle: DetalleProductoDto = {
      linea_detalle: lineNumber.toString(),
      plu: productInfo.plu?.toString() || cartProduct.oldId,
      cantidad: cantidad.toString(),
      descripcion: productInfo.coreName || productInfo.name || cartProduct.name,
      monto: monto,
      tipo: 'MIXTO',
      modificadores: 'N',
      // Para MIXTO no hay modificadores, pero el Core espera el campo como array vacío
      modificadores_opciones: [],
      mixto_opciones: mixtoOpciones,
      source: cartItem.source || 'menu'
    };

    logger.info('[buildMixtoProductDetail] Detalle construido', { 
      oldId: cartProduct.oldId,
      plu: detalle.plu,
      descripcion: detalle.descripcion,
      mixtoOpciones: mixtoOpciones.length
    });

    return detalle;
  } catch (error) {
    logger.error('[buildMixtoProductDetail] Error construyendo detalle', { 
      error,
      cartItem 
    });
    return null;
  }
};

/**
 * Construye el array de detalles desde múltiples items del cart
 */
export const buildOrderDetailsFromCart = async (
  cartItems: Cart[],
  cluster?: string
): Promise<DetalleProductoDto[]> => {
  logger.info('[buildOrderDetailsFromCart] Construyendo detalles', { 
    itemCount: cartItems.length 
  });

  const detalles: DetalleProductoDto[] = [];
  let lineNumber = 1;

  // Helper interno para procesar un solo producto dentro de un cart
  const processSingleProduct = async (baseCartItem: Cart, product: CartProduct) => {
    const cartItem = { ...baseCartItem, product } as Cart;

    // Validar que exista oldId y que sea numérico antes de consultar
    if (!product || product.oldId === undefined || product.oldId === null || product.oldId === '') {
      logger.warn('[buildOrderDetailsFromCart] Producto sin oldId, se omite', { cartItem });
      return;
    }

    const oldIdNumber = Number(product.oldId);
    if (Number.isNaN(oldIdNumber)) {
      logger.warn('[buildOrderDetailsFromCart] oldId no numérico, se omite', {
        oldIdRaw: product.oldId,
        cartItem,
      });
      return;
    }

    logger.info('[buildOrderDetailsFromCart] OldId para consulta', {
      oldIdRaw: product.oldId,
      oldIdNumber,
    });
    logger.debug('[buildOrderDetailsFromCart] cartProduct', { cartProduct: product });

    // Obtener información del producto para determinar el tipo
    const productInfo = await getProductByOldId(oldIdNumber);
    
    let detalle: DetalleProductoDto | null = null;
    
    if (productInfo && productInfo.type === 'COMBO') {
      // Es un combo
      logger.info('[buildOrderDetailsFromCart] Procesando COMBO', { oldId: product.oldId });
      const comboDetalles = await buildComboProductDetail(cartItem, lineNumber, cluster);

      for (const det of comboDetalles) {
        detalles.push(det);
        lineNumber++;
      }

      return;
    } else if (productInfo && productInfo.type === 'MIXTO') {
      // Es un producto mixto
      logger.info('[buildOrderDetailsFromCart] Procesando MIXTO', { oldId: product.oldId });
      detalle = await buildMixtoProductDetail(cartItem, lineNumber, cluster);
    } else {
      // Es un producto individual
      logger.info('[buildOrderDetailsFromCart] Procesando INDIVIDUAL', { oldId: product.oldId });
      detalle = await buildIndividualProductDetail(cartItem, lineNumber, cluster);
    }
    
    if (detalle) {
      detalles.push(detalle);
      lineNumber++;
    }
  };

  for (const cartItem of cartItems) {
    const rawProduct = cartItem.product as any;

    if (Array.isArray(rawProduct)) {
      // Carrito compuesto: múltiples productos en un solo registro
      logger.info('[buildOrderDetailsFromCart] Producto es un arreglo, procesando productos compuestos', {
        length: rawProduct.length,
      });

      for (const p of rawProduct) {
        await processSingleProduct(cartItem, p as CartProduct);
      }
    } else {
      // Producto individual en el registro
      await processSingleProduct(cartItem, rawProduct as CartProduct);
    }
  }

  logger.info('[buildOrderDetailsFromCart] Detalles construidos', { 
    totalLines: detalles.length 
  });

  return detalles;
};

/**
 * Calcula el total de la orden desde los detalles
 */
export const calculateOrderTotal = (detalles: DetalleProductoDto[]): number => {
  return detalles.reduce((total, detalle) => {
    return total + parseFloat(detalle.monto);
  }, 0);
};
