import { PaginatedDataDto } from "./paginated-data.dto";
import { ResponseDTO } from "./response.dto";

/**
 * How to send a successful response:
 * This is a generic class that can be used to send a successful response with any data type.
 * You can implement your own ResponseDto classes to handle different types of responses.
 *
 *  To return one user: User (User extends SafeObject)
 *  const response = new ResponseOkDto<User>("Success", "Data retrieved successfully", user);
 *  sendResponse(res, response);
 *
 *  To return a list of users: User[] (User extends SafeObject)
 *  const paginatedResponse = new ResponseOkDto("Success", "Data retrieved successfully",
 *   new PaginatedDataDto(data, page, limit, total));
 *  sendResponse(res, paginatedResponse);
 *
 */

export class ResponseOkDto<
  T extends { [key: string]: any }
> extends ResponseDTO {
  data?: T | T[] | PaginatedDataDto<T>;

  constructor(
    message: string,
    code: number = 200,
    data?: T | T[] | PaginatedDataDto<T>
  ) {
    super();
    this.success = true;
    this.code = code;

    this.message = message;
    this.data = data;
  }

  toJson(): Record<string, any> {
    return {
      data: this.data,
      message: this.message,
      success: this.success,
      code: this.code,
    };
  }
}
