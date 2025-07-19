import { getEnvVariable, getOptionalEnvVariable } from "./env-loading";

export const appEnv = {
  app: {
    name: getEnvVariable<string>("APP_NAME", "string"),
    version: getEnvVariable<string>("APP_VERSION", "string"),
  },
  server: {
    baseRouterUrlV1: getEnvVariable<string>("BASE_ROUTER_URL_V1", "string"),
    port: getOptionalEnvVariable<Number>("PORT", "number") || 3000,
    env: getOptionalEnvVariable<string>("NODE_ENV", "string") || "development",
  },
  cookies: {
    maxAge: getEnvVariable<string>("COOKIES_MAX_AGE", "string"),
  },
  cors: {
    origin: getEnvVariable<string>("CORS_ORIGIN", "string"),
  },
  logs: {
    console_logs: getOptionalEnvVariable<Boolean>("LOG_CONSOLE", "boolean"),
    logs_path: getEnvVariable<string>("LOGS_PATH", "string"),
  },
};
