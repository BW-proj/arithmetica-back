import { Response } from "express";
import { ResponseDTO } from "../dto/responses/response.dto";

export const sendResponse = (res: Response, responseDto: ResponseDTO) => {
  return res.status(responseDto.code).json(responseDto.toJson());
};
