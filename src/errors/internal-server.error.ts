import { CustomError } from "./custom-error";
import { HttpStatusCode } from "./httpStatusCodeEnum";

export class InternalServerError extends CustomError {
  constructor(message: string = "Internal server error.", details?: any) {
    super(message, HttpStatusCode.INTERNAL_SERVER, "INTERVAL", details);
  }
}
