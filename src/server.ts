import helmet from "helmet";
import express, { Express } from "express";
import { rateLimiterConfig } from "./middlewares/config/rate-limiter";
import { morganConfig } from "./middlewares/config/morgan";
import { corsConfig } from "./middlewares/config/cors";
import { bodyParserConfig } from "./middlewares/config/body-parser";
import { appEnv } from "./utils/env/app-env";
import { errorHandlerMiddleware } from "./middlewares/error-handler.middleware";
import cookieParser from "cookie-parser";
import baseRouter from "./routers/baseV1.router";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupWebSocket } from "./utils/socket-setup";

/**
 * The server class is a singleton class that creates an instance of the express app.
 * It also configures the app with middleware and routes.
 */
export class ArithmeticaServer {
  private static instance: ArithmeticaServer;
  public app: Express;
  public httpServer: any;

  public static getInstance(): ArithmeticaServer {
    if (!ArithmeticaServer.instance) {
      ArithmeticaServer.instance = new ArithmeticaServer();
    }
    return ArithmeticaServer.instance;
  }

  private constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);

    const io = new Server(this.httpServer, {
      cors: {
        origin: appEnv.cors.origin,
        credentials: true,
      },
    });
    setupWebSocket(io);

    this.config();
    this.routes();
    this.errorHandlers();
  }

  // Configure the app with middleware
  private config() {
    this.app.use(rateLimiterConfig);
    this.app.use(morganConfig);
    this.app.use(cookieParser());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(bodyParserConfig);
    this.app.use(helmet());
    this.app.use(corsConfig);
  }
  // Configure the app with routes
  private routes() {
    this.app.use(appEnv.server.baseRouterUrlV1, baseRouter);
  }

  // Configure the app with error handlers middleware
  private errorHandlers() {
    this.app.use(errorHandlerMiddleware);
  }
}
