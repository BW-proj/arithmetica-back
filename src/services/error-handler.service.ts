import { Request, Response } from "express";
import { isObjectEmpty } from "../utils/helpers/is-object-empty";
import { logger } from "../loggers/logger";
import { CustomError } from "../errors/custom-error";
import { ResponseErrorDto } from "../dto/responses/response-error.dto";
import { sendResponse } from "../utils/send-response";

export class ErrorHandlerService {
  private static instance: ErrorHandlerService;
  public static getInstance(): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService();
    }
    return ErrorHandlerService.instance;
  }

  handleUncaughtException(err: Error): void {
    this.logError(err);
    if (!this.isTrustedError(err)) {
      logger.error("Caught untrusted error. Exiting process...");
      process.exit(1);
    }
  }

  public async handleError(
    error: Error,
    req: Request,
    res: Response
  ): Promise<void> {
    this.logError(error, req);
    this.sendResponseError(error, res);
  }

  public async logError(err: Error, req?: Request): Promise<void> {
    let errorResponse = {};
    if (req) {
      errorResponse = {
        url: req.originalUrl || req.url,
        method: req.method,
        body: isObjectEmpty(req.body) ? undefined : req.body,
        params: isObjectEmpty(req.params) ? undefined : req.params,
        query: isObjectEmpty(req.query) ? undefined : req.query,
      };
    }

    if (err instanceof CustomError && err.statusCode < 500) {
      // Log the error with info level if it is a client error
      logger.info({ ...errorResponse, ...err.toLogObject() });
    } else if (err instanceof CustomError && err.statusCode >= 500) {
      // Log the error with warn level if it is a server error
      logger.error({ ...errorResponse, ...err.toLogObject() });
    } else {
      // Log the error with error level if it is a server error or unhandled error
      logger.error({
        ...errorResponse,
        statusCode: 500,
        message: err.message,
        stack: err.stack,
      } );
    }
  }

  public async sendResponseError(err: Error, res: Response): Promise<void> {
    if (err instanceof CustomError) {
      const errorResponse = new ResponseErrorDto(err);
      sendResponse(res, errorResponse);
      return;
    }

    // If the error is not an instance of CustomError, we will return a generic error message with least information
    const errorResponse = ResponseErrorDto.fromUnknownError(err);
    sendResponse(res, errorResponse);
  }

  public isTrustedError(error: Error): boolean {
    if (error instanceof CustomError) {
      return true;
    }

    return false;
  }
}
