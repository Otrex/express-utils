
export const _validateConfig = <T extends Record<string, any>>(config: T) => {
  const missingKeys: string[] = [];
  Object.entries(config).forEach(([baseKey, baseValue]) => {
    Object.entries(baseValue).forEach(([key, value]) => {
      if (value === '' || value === undefined) {
        missingKeys.push(`${baseKey}.${key}`);
      }
    });
  });
  if (missingKeys.length) {
    global.console.error(
      `The following configuration keys are not set: ${missingKeys.join(', ')}`,
    );
    process.exit(1);
  }
};