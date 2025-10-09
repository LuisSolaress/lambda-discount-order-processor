import { BusinessError } from "../errors/base.error";
import { HttpStatusCodes } from "../enums";
import { logger } from "./logger";

class CustomError extends Error {
  statusCode: number;

  constructor(statusCode: number, error: { type: string; message: string }) {
    super(error.message);
    this.name = error.type;
    this.statusCode = statusCode;
  }
}

export const errorHandler = (error: Error) => {
  if (error instanceof BusinessError) {
    logger.error(`[error] ${error.type}: ${error.message}`);
    throw new CustomError(HttpStatusCodes.BAD_REQUEST, {
      type: error.type,
      message: error.message,
    });
  }

  logger.error(`[error] ${error.message}`, { stack: error.stack });
  throw new CustomError(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
    type: error?.name || "InternalServerError",
    message: error?.message || "An internal server error occurred",
  });
};
