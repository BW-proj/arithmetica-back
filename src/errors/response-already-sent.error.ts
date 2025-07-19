import { CustomError } from "./custom-error";
import { HttpStatusCode } from "./httpStatusCodeEnum";

export class ResponseAlreadySentError extends CustomError {
  constructor(message: string = "Response already sent.", details?: any) {
    super(message, HttpStatusCode.INTERNAL_SERVER, "ALREADY_SENT", details);
  }
}
