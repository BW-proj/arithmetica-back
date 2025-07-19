import { CustomError } from "./custom-error";
import { HttpStatusCode } from "./httpStatusCodeEnum";

export class ParsingError extends CustomError {
  constructor(value: any, message: string = "Parsing error.", details?: any) {
    super(message, HttpStatusCode.INTERNAL_SERVER, "PARSING", {
      value,
      ...details,
    });
  }
}
