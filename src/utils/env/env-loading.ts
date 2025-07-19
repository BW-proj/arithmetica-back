import { VarEnvValidationError } from "../../errors/var-env-validation.error";
import { EnvVarType, validateEnvVariable } from "./validate-env-variable";

/*
 * This file is responsible for loading and validating environment variables from the .env file.
 * It must not use the logger as the logger uses the environment variables. (circular dependency)
 */

require("dotenv").config();

export const getEnvVariable = <T>(key: string, type: EnvVarType): T => {
  const value = process.env[key];

  if (!value) {
    console.error(`Environment variable ${key} is required`);
    process.exit(1);
  }

  let validated;
  try {
    validated = validateEnvVariable<T>(value, type, key);
  } catch (error) {
    if (error instanceof VarEnvValidationError) {
      console.error(
        `Error validating environment variable ${key}: ${error.toLogObject()}`
      );
      process.exit(1);
    }
  }

  if (!validated) {
    console.error(`Error validating environment variable ${key}`);
    process.exit(1);
  }

  return validated;
};

export const getOptionalEnvVariable = <T>(
  key: string,
  type: EnvVarType
): T | undefined => {
  const value = process.env[key];

  if (!value) {
    console.warn(
      `Environment variable ${key} is not set but retrieved optionally.`
    );
    return undefined;
  }

  let validated;
  try {
    validated = validateEnvVariable<T>(value, type, key);
  } catch (error) {
    if (error instanceof VarEnvValidationError) {
      console.error(
        `Error validating environment variable ${key}: ${error.message}`
      );
      process.exit(1);
    }
  }

  if (!validated) {
    console.warn(`Error validating environment variable ${key}`);
  }

  return validated;
};
