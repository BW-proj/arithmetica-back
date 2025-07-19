import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { NextFunction, Request, Response } from "express";
import { DTO } from "./dto";
import { InvalidInputError } from "../errors/invalid-input.error";
import { ValidationType } from "./validation-type";

export function validateDto(
  dtoClass: new () => DTO, // Check that dtoClass is an instance of class that extends DTO
  source: ValidationType = ValidationType.BODY
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req, res, next) => {
    const dtoInstance = plainToInstance(dtoClass, req[source]);
    const errors = await validate(dtoInstance);

    if (errors.length > 0) {
      const errorsList = errors.map((error) => {
        error.property, error.constraints;
      });
      next(new InvalidInputError(source, errorsList));
    }

    next();
  };
}
