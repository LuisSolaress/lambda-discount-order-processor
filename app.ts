import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { logger, validateRequest } from "./src/common";
import { CreateOrderFromUserDto } from "./src/dto/create-order-from-user.dto";
import { createOrderFromUserId } from "./src/services/order-from-cart.service";

/**
 * Lambda handler principal para crear órdenes desde el carrito del usuario
 * 
 * Flujo completo:
 * 1. Recibe userId y datos del cliente
 * 2. Obtiene el carrito del usuario
 * 3. Construye el detalle de productos (INDIVIDUAL, COMBO, MIXTO)
 * 4. Genera número de orden, tag, fecha, hora
 * 5. Calcula totales
 * 6. Guarda en orderWorkflow (estado: pending)
 * 7. Envía al Core API
 * 8. Actualiza orderWorkflow (estado: success/error)
 * 9. Retorna respuesta
 */
module.exports.lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    logger.info("[lambdaHandler] Event received", { event });

    // Validar que sea un POST request
    if (event.httpMethod && event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({
          error: "Método no permitido. Use POST",
        }),
      };
    }

    // Parsear el body
    let parsedBody;
    
    if (event.body) {
      parsedBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Body del request es requerido",
        }),
      };
    }

    logger.info("[lambdaHandler] Procesando orden desde userId", { userId: parsedBody.userId });

    // Validar el request
    const validatedRequest = await validateRequest(CreateOrderFromUserDto, parsedBody);

    // Crear la orden completa (obtiene carrito, construye JSON, envía al Core API)
    const result = await createOrderFromUserId(validatedRequest);

    logger.info("[lambdaHandler] Orden procesada exitosamente", {
      orden: result.order.orden,
      tag: result.order.tag,
      total: result.order.total_orden
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Orden creada y enviada exitosamente",
        data: {
          order: result.order,
          coreResponse: result.coreResponse
        }
      }),
    };
  } catch (error) {
    logger.error("[lambdaHandler] Error procesando request", { error });

    if (error instanceof Error) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: error.message || "Error procesando la orden",
        }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error interno del servidor",
      }),
    };
  }
};
