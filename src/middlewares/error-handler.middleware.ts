import { NextFunction, Request, Response } from "express";
import { ErrorHandlerService } from "../services/error-handler.service";

export const errorHandlerMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  ErrorHandlerService.getInstance().handleError(err, req, res);
};
