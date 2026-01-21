import axios, { AxiosResponse } from 'axios';
import { logger } from '../common';
import { CreateOrderDto } from '../dto/order-request.dto';

/**
 * URL del Core API
 */
const CORE_API_URL = 'http://190.113.88.139:4001/api2023/';

/**
 * Construye los headers requeridos para el Core API
 * Permite ajustar valores según el canal/forma de venta (WEB, APP, etc.)
 */
const buildCoreApiHeaders = (channelOrFormaVenta?: string) => {
  // Normalizar canal/forma_venta, valor por defecto APP
  const fv = (channelOrFormaVenta || 'APP').toUpperCase();

  // TODO: ajustar lógica/valores específicos por canal (WEB, APP, etc.)
  return {
    Key: 'B|vE<@nn0n@Gch23',
    FV: fv,
    'Content-Type': 'application/json',
  };
};

/**
 * Interface para la respuesta del Core API
 */
export interface CoreApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Envía los datos de la orden al Core API
 * @param orderData - Datos de la orden en formato CreateOrderDto
 * @returns Respuesta del Core API
 */
export const sendCoreData = async (orderData: CreateOrderDto | CreateOrderDto[]): Promise<CoreApiResponse> => {
  try {
    // Determinar si es una orden única o múltiples
    const isArray = Array.isArray(orderData);
    const ordersToSend = isArray ? orderData : [orderData];

    // Tomar la primera orden para determinar canal/forma_venta
    const mainOrder = ordersToSend[0];
    const channelOrFormaVenta = (mainOrder && (mainOrder.channel || mainOrder.forma_venta)) || 'APP';
    const headers = buildCoreApiHeaders(channelOrFormaVenta);

    logger.info('[sendCoreData] Preparando datos para Core API', {
      url: CORE_API_URL + 'comanda',
      ordersCount: ordersToSend.length,
      orderNumbers: ordersToSend.map(o => o.orden),
      channelOrFormaVenta
    });

    // Log detallado del payload y headers que se enviarán
    logger.debug('[sendCoreData] Payload completo a enviar', {
      body: ordersToSend,
      headers
    });

    // Realizar el request al Core API
    const response: AxiosResponse = await axios.post(
      CORE_API_URL + 'comanda',
      ordersToSend,
      {
        headers,
        timeout: 30000 // 30 segundos de timeout
      }
    );

    logger.info('[sendCoreData] Respuesta exitosa del Core API', {
      status: response.status,
      data: response.data
    });

    return {
      success: true,
      message: 'Datos enviados exitosamente al Core API',
      data: response.data
    };

  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error('[sendCoreData] Error en request al Core API', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method
        }
      });

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        data: error.response?.data
      };
    }

    logger.error('[sendCoreData] Error desconocido', { error });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al enviar datos'
    };
  }
};
