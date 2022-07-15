type GenericConfig = Record<string, boolean | number | string | Record<string, boolean | number | string >>;
export const _validateConfig = <T extends Record<string, any>>(config: T, optional: string[] = [], exitOnFail = true) => {
  const missingKeys: string[] = [];
  Object.entries(config).forEach(([baseKey, baseValue]) => {
    Object.entries(baseValue).forEach(([key, value]) => {
      if (value === '' || value === undefined) {
        missingKeys.push(`${baseKey}.${key}`);
      }
    });
  });
  if (missingKeys.filter((k) => !optional.includes(k)).length) {
    global.console.error(
      `The following configuration keys are not set: ${missingKeys.join(', ')}`,
    );

    if (exitOnFail) process.exit(1)
    else throw new Error(`The following configuration keys are not set: ${missingKeys.join(', ')}`)
  }
};

export const _createConfig = <T extends GenericConfig>(data: { exitOnFail?: boolean, optional: string[], config: T }) => _validateConfig(data.config, data.optional || [], data.exitOnFail);