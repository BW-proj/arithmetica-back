import { CustomError } from "../../errors/custom-error";
import { InternalServerError } from "../../errors/internal-server.error";
import { ResponseDTO } from "../responses/response.dto";

/**
 * This class is used to send a error response.
 *
 * How to send an error response:
 * This is a generic class that can be used to send an error response with any data type.
 * You can implement your own ResponseDto classes to handle different types of responses.
 *
 * How to use:
 * const error = new ResponseErrorDto(new CustomError('Error message', 400, 'error_code'), { details: 'error details' });
 * res.status(error.code).json(error.toJson());
 *
 *
 */

export class ResponseErrorDto extends ResponseDTO {
  details?: any;
  description: string;

  static fromUnknownError(error: Error): ResponseErrorDto {
    if (error instanceof CustomError) {
      return new ResponseErrorDto(error);
    }

    return new ResponseErrorDto(new InternalServerError());
  }

  constructor(error: CustomError, details?: any) {
    super();
    this.message = error.message;
    this.description = error.errorCode;
    this.code = error.statusCode;
    this.success = false;
    const errorDetails = error.details || {};
    this.details = { ...errorDetails, ...details };
  }

  toJson(): Record<string, any> {
    return {
      message: this.message,
      description: this.description,
      success: this.success,
      code: this.code,
      details: this.details,
    };
  }
}
