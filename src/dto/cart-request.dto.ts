import { IsInt, IsOptional, IsString, ValidateIf } from "class-validator";

/**
 * DTO para request de carrito
 * Requiere userId O sessionId (al menos uno debe estar presente)
 */
export class CartRequestDto {
  @IsOptional()
  @IsInt()
  @ValidateIf((o) => !o.sessionId)
  userId?: number;

  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.userId)
  sessionId?: string;

  /**
   * Validación personalizada: al menos uno debe estar presente
   */
  static validate(dto: CartRequestDto): { valid: boolean; error?: string } {
    if (!dto.userId && !dto.sessionId) {
      return {
        valid: false,
        error: "Debe proporcionar userId o sessionId",
      };
    }
    return { valid: true };
  }
}
