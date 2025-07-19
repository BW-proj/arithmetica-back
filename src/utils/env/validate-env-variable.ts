import { VarEnvValidationError } from "../../errors/var-env-validation.error";

export type EnvVarType = "string" | "number" | "boolean" | "array" | "json";

export const validateEnvVariable = <T>(
  value: string,
  type: EnvVarType,
  key: string
): T => {
  switch (type) {
    case "string":
      return value as T;
    case "number": {
      const parsed = Number(value);
      if (isNaN(parsed)) {
        throw new VarEnvValidationError(value, "number");
      }
      return parsed as T;
    }
    case "boolean": {
      if (value !== "true" && value !== "false") {
        throw new Error(`must be "true" or "false"`);
      }
      return (value === "true") as T;
    }
    case "array": {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        throw new VarEnvValidationError(value, "json array");
      }
      return parsed as T;
    }
    case "json": {
      const parsed = JSON.parse(value);
      if (
        typeof parsed !== "object" ||
        Array.isArray(parsed) ||
        parsed === null
      ) {
        throw new VarEnvValidationError(value, "JSON object");
      }
      return parsed as T;
    }
  }
};
