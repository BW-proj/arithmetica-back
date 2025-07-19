import { NextFunction, Request, Response, Router } from "express";
import { sendResponse } from "../utils/send-response";
import { ResponseOkDto } from "../dto/responses/response-ok.dto";
import { PaginatedDataDto } from "../dto/responses/paginated-data.dto";
import { NotFoundError } from "../errors/not-found-error";

const exampleRouter = Router();

/**
 * A router example that demonstrates the use of this nodejs template to send responses.
 * You can try these routes by running the server and sending requests with pre-built bruno request in : project_directory/bruno-express-rdy-basics
 */

interface User {
  name: string;
  age: number;
}
/**
 * The method sendReponse is used to send a response to the client.
 * To send a successful response, you can use the ResponseOkDto class like so:
 *
 * NB: In the following case, the response does not contain any data other than the message and status code.
 */
exampleRouter.get("/no-data", (req, res) => {
  sendResponse(
    res,
    new ResponseOkDto("Some process was sucessfully performed...", 200)
  );
});

/**
 * To send a successful response containing a single object, you can use the ResponseOkDto class like so:
 */
exampleRouter.get("/single-object", (req, res) => {
  const responseJsonObj: User = {
    name: "John Doe",
    age: 30,
  };

  sendResponse(
    res,
    new ResponseOkDto<User>(
      "Single object retrieved successfully",
      200,
      responseJsonObj
    )
  );
});

/**
 * To send a successful response containing a list of objects, you can use the ResponseOkDto class like so:
 */
exampleRouter.get("/list-of-objects", (req, res) => {
  const responseJsonArr: User[] = [
    {
      name: "John Doe",
      age: 30,
    },
    {
      name: "Jane Doe",
      age: 25,
    },
  ];

  sendResponse(
    res,
    new ResponseOkDto<User[]>(
      "List of objects retrieved successfully",
      200,
      responseJsonArr
    )
  );
});

/**
 * To send a successful response containing a paginated list of objects, you can use the ResponseOkDto class like so:
 */
exampleRouter.get("/page-of-objects", (req, res) => {
  const responseJsonArr: User[] = [
    {
      name: "John Doe",
      age: 30,
    },
    {
      name: "Jane Doe",
      age: 25,
    },
  ];

  const page = 1;
  const pageSize = 2;
  const total = 100;

  sendResponse(
    res,
    new ResponseOkDto<User>(
      "Page of objects retrieved successfully",
      200,
      new PaginatedDataDto<User>(responseJsonArr, page, pageSize, total)
    )
  );
});

/**
 * To send an error response, you can use a class that extends the CustomError class like so:
 *
 * NB: The error middleware will catch this error and send a response to the client since it is thrown synchronously.
 */
exampleRouter.get("/error", (req: Request, res: Response) => {
  throw new NotFoundError("someUserName", "User not found", "username");
});

/**
 * To send an error response, you can use a class that extends the CustomError class like so:
 *
 * NB: We need to catch the error and pass it to the next function to be handled by the error middleware since it is thrown asynchronously.
 */
exampleRouter.get(
  "/error-async",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      throw new NotFoundError("someUserName", "User not found", "username");
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * An untrusted server error simulation.
 * This type of error is thrown by cron jobs, third-party libraries, etc.
 * The error is
 *
 */
exampleRouter.get(
  "/server-error-sim-untrusted",
  async (req: Request, res: Response, next: NextFunction) => {
    setTimeout(() => {
      throw new Error("Server error");
    }, 1000);
    sendResponse(res, new ResponseOkDto("Sim OK", 200));
  }
);

exampleRouter.get(
  "/server-error-sim-trusted",
  async (req: Request, res: Response, next: NextFunction) => {
    setTimeout(() => {
      throw new NotFoundError("User", "User not found", "username");
    }, 1000);
    sendResponse(res, new ResponseOkDto("Sim OK", 200));
  }
);

export default exampleRouter;
