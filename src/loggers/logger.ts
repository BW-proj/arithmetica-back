import { createLogger, format, transports } from "winston";

import path from "path";
import DailyRotateFile from "winston-daily-rotate-file";
import { appEnv } from "../utils/env/app-env";
const { combine, timestamp, prettyPrint } = format;

/**
 * Winston documentation :
 * https://github.com/winstonjs/winston
 * https://github.com/winstonjs/winston/tree/2.x
 *
 */

const logsPath = path.resolve(process.cwd(), appEnv.logs.logs_path);

const transport = new DailyRotateFile({
  level: "info",
  filename: path.resolve(logsPath, "application-%DATE%.log"),
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

const errorTransport = new DailyRotateFile({
  level: "error",
  filename: path.resolve(logsPath, "error-%DATE%.log"),
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

export const logger = createLogger({
  silent: false,
  level: "info",
  format: combine(
    format.json(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    prettyPrint()
  ),
  transports: [transport, errorTransport],
});

if (appEnv.logs.console_logs) {
  logger.add(
    new transports.Console({
      format: format.simple(),
    })
  );
}
