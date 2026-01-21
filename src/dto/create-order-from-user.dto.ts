import { IsNumber, IsString, IsOptional, IsEnum } from "class-validator";

/**
 * DTO para crear una orden desde el userId
 */
export class CreateOrderFromUserDto {
  @IsNumber()
  userId: number;

  @IsString()
  restaurante: string;

  @IsString()
  cliente_telefono: string;

  @IsString()
  cliente_nombre: string;

  @IsString()
  cliente_direccion: string;

  @IsOptional()
  @IsString()
  nit?: string;

  @IsOptional()
  @IsString()
  nit_nombre?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  Direccion_Coordenadas?: string;

  @IsOptional()
  @IsEnum(['APP', 'WEB'])
  forma_venta?: string;

  @IsOptional()
  @IsEnum(['APP', 'WEB'])
  channel?: string;

  @IsOptional()
  @IsString()
  cluster?: string;
}
