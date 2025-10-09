import { IsString, IsEmail, IsOptional, IsBoolean } from "class-validator";

/**
 * Example DTO - Replace with your actual request DTOs
 */
export class ExampleRequestDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
