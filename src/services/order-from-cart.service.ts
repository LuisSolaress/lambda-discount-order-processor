import { logger } from '../common';
import { sql } from 'drizzle-orm';
import { CreateOrderFromUserDto } from '../dto/create-order-from-user.dto';
import { CreateOrderDto } from '../dto/order-request.dto';
import { getCartService } from './cart.service';
import { buildOrderDetailsFromCart, calculateOrderTotal } from './order-builder.service';
import { generateOrderTag, formatDate, formatTime } from '../common/order-utils';
import { sendCoreData } from '../transactions/create-order.transaction';
import { saveOrderWorkflow, saveOrderWorkflowError } from './order-workflow.service';
import { getDb } from '../db/connection';
import { orderTable } from '../schemas/order.schema';

/**
 * Crea una orden completa desde el userId, obteniendo el carrito y construyendo el JSON
 */
export const createOrderFromUserId = async (
  orderRequest: CreateOrderFromUserDto
): Promise<{ order: CreateOrderDto; coreResponse: any }> => {
  logger.info('[createOrderFromUserId] Iniciando creación de orden', { 
    userId: orderRequest.userId 
  });

  // 1. Obtener el carrito del usuario
  const cartItems = await getCartService({ userId: orderRequest.userId });

  if (!cartItems || cartItems.length === 0) {
    throw new Error(`No se encontraron items en el carrito para el usuario ${orderRequest.userId}`);
  }

  logger.info('[createOrderFromUserId] Items del carrito obtenidos', { 
    count: cartItems.length 
  });

  // 2. Construir el detalle de productos desde el carrito
  const detalles = await buildOrderDetailsFromCart(
    cartItems.map(item => item.carts),
    orderRequest.cluster // Pasar cluster del request body
  );

  if (detalles.length === 0) {
    throw new Error('No se pudo construir ningún detalle de producto válido');
  }

  // 3. Calcular totales
  const totalOrden = calculateOrderTotal(detalles);

  // 4. Generar datos de la orden (tag, fecha, hora)
  const now = new Date();
  const orderTag = generateOrderTag();

  const direccionCoordenadas =
    orderRequest.Direccion_Coordenadas && orderRequest.Direccion_Coordenadas.trim() !== ''
      ? orderRequest.Direccion_Coordenadas
      : '14.59916353464088,-90.57646230799594'; // Coordenadas de prueba

  // 5. Insertar la orden en la tabla order para obtener el id real
  const db = await getDb();

  const [insertedOrder] = await db
    .insert(orderTable)
    .values({
      contactName: orderRequest.cliente_nombre,
      contactPhone: orderRequest.cliente_telefono,
      invoiceName: orderRequest.nit_nombre || 'CONSUMIDOR FINAL',
      invoiceNit: orderRequest.nit || 'CF',
      deliveryAddress: orderRequest.cliente_direccion,
      // Punto fijo para pruebas: POINT(longitude latitude) con SRID 4326
      point: sql`ST_GeomFromText('POINT(-90.57646230799594 14.59916353464088)', 4326)`,
      restaurantId: parseInt(orderRequest.restaurante, 10) || null,
      totalAmount: totalOrden.toFixed(2) as any,
      userId: orderRequest.userId,
      detailData: detalles as any,
      createdAt: now,
      observations: orderRequest.observaciones || '',
      channel: orderRequest.channel || orderRequest.forma_venta || 'WEB',
    })
    .returning();

  if (!insertedOrder || insertedOrder.id == null) {
    throw new Error('No se pudo insertar la orden en la tabla order');
  }

  const orderId = insertedOrder.id.toString();

  // 6. Construir el objeto de orden completo para el Core API usando el id como orden
  const order: CreateOrderDto = {
    forma_venta: orderRequest.forma_venta || 'WEB',
    orden: orderId,
    tag: orderTag,
    fecha: formatDate(now),
    hora: formatTime(now),
    restaurante: orderRequest.restaurante,
    cliente_telefono: orderRequest.cliente_telefono,
    cliente_nombre: orderRequest.cliente_nombre,
    cliente_direccion: orderRequest.cliente_direccion,
    nit: orderRequest.nit || 'CF',
    nit_nombre: orderRequest.nit_nombre || 'CONSUMIDOR FINAL',
    total_efectivo: totalOrden.toFixed(2),
    total_credito: '0',
    total_orden: totalOrden.toFixed(2),
    observaciones: orderRequest.observaciones || '',
    detalle: detalles,
    visanet: {
      visanet_total: '',
      visanet_system_trace: '',
      visanet_hora: '',
      visanet_fecha: '',
      visanet_reference_number: '',
      visanet_authidresponse: '',
      visanet_terminal: '',
      visanet_nombre: '',
      visanet_tarjeta: '',
      visanet_vencimiento: ''
    },
    detalle_lineas: detalles.length.toString(),
    channel: orderRequest.channel || 'WEB',
    Direccion_Coordenadas: direccionCoordenadas
  };

  logger.info('[createOrderFromUserId] Orden construida', {
    orden: order.orden,
    tag: order.tag,
    total: order.total_orden,
    productos: order.detalle.length
  });

  try {
    // 6. Guardar orden en workflow (estado: pending)
    const workflow = await saveOrderWorkflow(
      orderRequest.userId,
      order,
      null,
      'pending'
    );

    logger.info('[createOrderFromUserId] Orden guardada en workflow', {
      workflowId: workflow.id,
      orden: order.orden
    });

    // 7. Enviar al Core API
    logger.info('[createOrderFromUserId] Enviando orden al Core API');
    const coreResponse = await sendCoreData(order);

    const exitoMensaje = coreResponse?.data?.exito;
    const inyeccionExitosa = coreResponse.success === true && exitoMensaje === 'Orden Recibida en Servidor';

    if (!inyeccionExitosa) {
      const errorMessage =
        coreResponse.error ||
        (exitoMensaje
          ? `Respuesta del Core API no exitosa: ${exitoMensaje}`
          : 'Respuesta del Core API inválida o incompleta');

      // Actualizar workflow con error
      await saveOrderWorkflowError(
        orderRequest.userId,
        order,
        errorMessage
      );

      logger.error('[createOrderFromUserId] Error al enviar al Core API', {
        orden: order.orden,
        error: errorMessage,
        coreResponse
      });
      throw new Error(`Error al enviar orden al Core API: ${errorMessage}`);
    }

    // 8. Actualizar workflow con respuesta exitosa
    await saveOrderWorkflow(
      orderRequest.userId,
      order,
      coreResponse,
      'success'
    );

    logger.info('[createOrderFromUserId] Orden enviada exitosamente al Core API', {
      orden: order.orden
    });

    return {
      order,
      coreResponse
    };
  } catch (error) {
    // Si hay error y no se guardó antes, intentar guardar el error
    try {
      await saveOrderWorkflowError(
        orderRequest.userId,
        order,
        error instanceof Error ? error.message : 'Error desconocido'
      );
    } catch (saveError) {
      logger.error('[createOrderFromUserId] Error guardando workflow de error', {
        saveError
      });
    }
    throw error;
  }
};
