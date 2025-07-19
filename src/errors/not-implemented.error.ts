import { CustomError } from "./custom-error";
import { HttpStatusCode } from "./httpStatusCodeEnum";

export default class NotImplementedError extends CustomError {
  constructor(message: string = "Not implemented yet.", details?: any) {
    super(message, HttpStatusCode.NOT_IMPLEMENTED, "NOT_IMPLEMENTED", details);
  }
}
