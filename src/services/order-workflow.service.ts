import { eq } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { orderWorkflowTable } from '../schemas/order-workflow.schema';
import { logger } from '../common';
import { CreateOrderDto } from '../dto/order-request.dto';

/**
 * Guarda una orden en la tabla orderWorkflow
 */
export const saveOrderWorkflow = async (
  userId: number,
  orderJson: CreateOrderDto,
  coreResponse?: any,
  status: string = 'pending'
) => {
  logger.info('[saveOrderWorkflow] Guardando orden en workflow', {
    userId,
    orden: orderJson.orden,
    status
  });

  try {
    const db = await getDb();

    const newWorkflow = await db
      .insert(orderWorkflowTable)
      .values({
        userId,
        orden: orderJson.orden,
        tag: orderJson.tag,
        restaurante: orderJson.restaurante,
        totalOrden: orderJson.total_orden,
        formaVenta: orderJson.forma_venta,
        channel: orderJson.channel,
        orderJson: orderJson as any,
        coreResponse: coreResponse || null,
        status,
        sentToCore: !!coreResponse,
        errorMessage: null
      })
      .returning();

    logger.info('[saveOrderWorkflow] Orden guardada exitosamente', {
      id: newWorkflow[0]?.id,
      orden: orderJson.orden
    });

    return newWorkflow[0];
  } catch (error) {
    logger.error('[saveOrderWorkflow] Error guardando orden', {
      error,
      userId,
      orden: orderJson.orden
    });
    throw error;
  }
};

/**
 * Actualiza el estado de una orden en el workflow
 */
export const updateOrderWorkflowStatus = async (
  id: string,
  status: string,
  coreResponse?: any,
  errorMessage?: string
) => {
  logger.info('[updateOrderWorkflowStatus] Actualizando estado', {
    id,
    status
  });

  try {
    const db = await getDb();

    const updated = await db
      .update(orderWorkflowTable)
      .set({
        status,
        coreResponse: coreResponse || null,
        sentToCore: !!coreResponse,
        errorMessage: errorMessage || null,
        updatedAt: new Date()
      })
      .where(eq(orderWorkflowTable.id, id))
      .returning();

    logger.info('[updateOrderWorkflowStatus] Estado actualizado', {
      id,
      status
    });

    return updated[0];
  } catch (error) {
    logger.error('[updateOrderWorkflowStatus] Error actualizando estado', {
      error,
      id
    });
    throw error;
  }
};

/**
 * Guarda una orden con error
 */
export const saveOrderWorkflowError = async (
  userId: number,
  orderJson: CreateOrderDto,
  errorMessage: string
) => {
  logger.info('[saveOrderWorkflowError] Guardando orden con error', {
    userId,
    orden: orderJson.orden
  });

  return saveOrderWorkflow(userId, orderJson, null, 'error').then(workflow => {
    return updateOrderWorkflowStatus(workflow.id, 'error', null, errorMessage);
  });
};
