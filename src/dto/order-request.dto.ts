import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum } from "class-validator";
import { Type } from "class-transformer";

/**
 * DTO para modificadores opcionales de un producto
 */
export class ModificadorOpcionDto {
  @IsString()
  modificadores_cantidad: string;

  @IsString()
  modificadores_plu: string;

  @IsString()
  modificadores_descripcion: string;

  @IsString()
  monto: string;
}

/**
 * DTO para opciones de producto mixto
 */
export class MixtoOpcionDto {
  @IsString()
  mixto_opcion: string;

  @IsString()
  mixto_cantidad: string;

  @IsString()
  mixto_plu: string;

  @IsString()
  mixto_descripcion: string;
}

/**
 * DTO para detalle de producto en la orden
 */
export class DetalleProductoDto {
  @IsString()
  linea_detalle: string;

  @IsString()
  plu: string;

  @IsString()
  cantidad: string;

  @IsString()
  descripcion: string;

  @IsString()
  monto: string;

  @IsEnum(['NORMAL', 'PROMO', 'DESCUENTO', 'MIXTO'])
  tipo: string;

  @IsString()
  modificadores: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MixtoOpcionDto)
  mixto_opciones?: MixtoOpcionDto[];

  @IsString()
  source: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ModificadorOpcionDto)
  modificadores_opciones?: ModificadorOpcionDto[];
}

/**
 * DTO para información de pago con Visanet
 */
export class VisanetDto {
  @IsString()
  visanet_total: string;

  @IsString()
  visanet_system_trace: string;

  @IsString()
  visanet_hora: string;

  @IsString()
  visanet_fecha: string;

  @IsString()
  visanet_reference_number: string;

  @IsString()
  visanet_authidresponse: string;

  @IsString()
  visanet_terminal: string;

  @IsString()
  visanet_nombre: string;

  @IsString()
  visanet_tarjeta: string;

  @IsString()
  visanet_vencimiento: string;
}

/**
 * DTO para crear una orden desde el carrito
 */
export class CreateOrderDto {
  @IsEnum(['APP', 'WEB', 'KIOSK', 'POS'])
  forma_venta: string;

  @IsString()
  orden: string;

  @IsString()
  tag: string;

  @IsString()
  fecha: string;

  @IsString()
  hora: string;

  @IsString()
  restaurante: string;

  @IsString()
  cliente_telefono: string;

  @IsString()
  cliente_nombre: string;

  @IsString()
  cliente_direccion: string;

  @IsString()
  nit: string;

  @IsString()
  nit_nombre: string;

  @IsString()
  total_efectivo: string;

  @IsString()
  total_credito: string;

  @IsString()
  total_orden: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleProductoDto)
  detalle: DetalleProductoDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => VisanetDto)
  visanet?: VisanetDto;

  @IsString()
  detalle_lineas: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  Direccion_Coordenadas?: string;
}
