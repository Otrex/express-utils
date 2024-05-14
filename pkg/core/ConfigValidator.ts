import { Logger } from "..";
import * as dotenv from "dotenv";

type GenericConfig<T = any> = Record<
  string,
  | boolean
  | number
  | string
  | Record<
    string,
    | T
    | boolean
    | number
    | string
    | string[]
    | number[]
    | Record<string, string | number | T>
  >
>;

export const _validateConfig = <T extends Record<string, any>>(
  config: T,
  optional: string[] = [],
  exitOnFail = true
) => {
  const missingKeys: string[] = [];
  Object.entries(config).forEach(([baseKey, baseValue]) => {
    Object.entries(baseValue).forEach(([key, value]) => {
      if (value === "" || value === undefined) {
        const ckey = `${baseKey}.${key}`
        const ckeyall = `${baseKey}.*`;
        if (optional.includes(ckey)) return;
        if (optional.includes(ckeyall)) return;
        missingKeys.push(ckey);
      }
    });
  });
  if (missingKeys.length) {
    const logger = new Logger("app.config");

    logger.useColor("red");
    logger.error("-------------------------------------------------");
    logger.error(
      `The following configuration keys are not set: \n\t- ${missingKeys.join(
        "\n\t- "
      )}`
    );

    if (exitOnFail) return process.exit(1);
  }

  const returnedConfig = {
    ...config,
    get: <M = any>(key: string, defaultValue: M) => {
      const keyArray = key.split(".");
      if (keyArray.length > 1) {
        let barrel: any = config;
        keyArray.forEach((v) => {
          barrel = barrel[v];
        });

        return (barrel || defaultValue) as keyof T | M;
      }

      return (config[key] || process.env[key] || defaultValue) as keyof T | M;
    },
  };

  return returnedConfig;
};

export const _createConfig = <T extends GenericConfig>(data: {
  exitOnFail?: boolean;
  optional?: string[];
  config: T;
}) => _validateConfig(data.config, data.optional || [], data.exitOnFail);

export const _useConfig = (configOption: {
  optional?: string[];
  exitOnFail?: boolean;
  envKey?: string
} & dotenv.DotenvConfigOptions) => {
  const { optional = [], exitOnFail, envKey, ...dotenvConfigOptions } = configOption;
  dotenv.config(dotenvConfigOptions);
  return <T extends GenericConfig>(config: T | ((env?: string) => T)) => {
    config = typeof config === "function" ? config(process.env[envKey || 'ENVIRONMENT']) : config;
    return _validateConfig(
      config,
      optional,
      exitOnFail
    );
  };
};

export default {
  createConfig: _createConfig,
  validateConfig: _validateConfig,
  useConfig: _useConfig,
};
