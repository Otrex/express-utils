import { Logger } from "..";
import * as dotenv from "dotenv";
type NestedKeyOf<T> = {
  [K in keyof T & (string | number)]: T[K] extends object
  ? `${K}` | `${K}.${keyof T[K] & string}`
  : `${K}`;
}[keyof T & (string | number)];

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
    get: <M = any>(key: NestedKeyOf<T>, defaultValue?: M) => {
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

export const _useConfig = <Env = any>(configOption: {
  optional?: string[];
  exitOnFail?: boolean;
  envKey?: string
  defaultEnv?: Env
} & dotenv.DotenvConfigOptions) => {
  const { optional = [], exitOnFail, defaultEnv, envKey, ...dotenvConfigOptions } = configOption;

  dotenv.config(dotenvConfigOptions);
  return <T extends GenericConfig>(config: T | ((env: Env) => T)) => {
    let appenv: Env;

    if (process.env[envKey || 'APP_ENVIRONMENT']) {
      appenv = process.env[envKey || 'APP_ENVIRONMENT'] as unknown as Env;
    } else if (defaultEnv) {
      appenv = defaultEnv
    } else {
      appenv = 'development' as unknown as Env
    }

    config = typeof config === "function" ? config(appenv) : config;

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
