import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { BusinessErrors } from "../errors/business-errors";

export const validateRequest = async <T extends object>(
  dtoClass: new () => T,
  plainObject: any
): Promise<T> => {
  const dtoInstance = plainToInstance(dtoClass, plainObject);
  const errors = await validate(dtoInstance);

  if (errors.length > 0) {
    const errorMessages = errors
      .map((err) => Object.values(err.constraints || {}).join(", "))
      .join("; ");
    throw BusinessErrors.InvalidRequest(errorMessages);
  }

  return dtoInstance;
};
