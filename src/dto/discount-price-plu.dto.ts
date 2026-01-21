import { IsInt, IsOptional, IsString, Min } from "class-validator";

/**
 * DTO para obtener el precio con descuento por PLU
 * Todos los parámetros son opcionales y deben ser enteros positivos
 */
export class GetDiscountPriceByPluDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  plu1?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  plu2?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  plu3?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  plu4?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  plu5?: number;

  @IsOptional()
  @IsString()
  cluster?: string;
}
