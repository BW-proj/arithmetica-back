import { HttpStatusCode } from "./httpStatusCodeEnum";

export abstract class CustomError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = HttpStatusCode.BAD_REQUEST,
    errorCode: string = "INTERNAL_ERROR",
    details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert the error into a JSON representation for consistent API responses.
   */
  public toJSON(): Record<string, any> {
    const response: Record<string, any> = {
      error: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
    };

    // Include details only if the status code is below HttpStatusCode.INTERNAL_SERVER code
    // This is to avoid leaking sensitive information in the response.
    if (this.statusCode < HttpStatusCode.INTERNAL_SERVER && this.details) {
      response.details = this.details;
    }

    return response;
  }

  // The toLogObject method is used to log the error in a structured way and include the stack trace.
  public toLogObject(): Record<string, any> {
    return {
      error: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      details: this.details,
      stack: this.stack,
    };
  }
}
