import { parsePathToScope } from "../utils";

export const colours = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  fg: {
    black: "\x1b[30m",
    default: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    crimson: "\x1b[38m", // Scarlet
  },
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
    crimson: "\x1b[48m",
  },
};

export type FGColor = keyof typeof colours.fg & (typeof colours)["reset"];
export type Level = "error" | "warning" | "info" | string;
export class _Logger {
  DEFAULT_SCOPE = "log";
  specifiedColor?: string;
  defaultColor: string;
  #console: any;
  #scope: string;
  logDebug: boolean;

  constructor(scope?: string, $console?: any) {
    this.setScope(scope);
    this.defaultColor = colours.reset;
    this.#console = $console || console;
  }

  setLogDebug(state: boolean) {
    this.logDebug = state;
  }

  setDefaultColor(color: FGColor) {
    this.defaultColor = colours.fg[color];
  }

  setScopeToDefault() {
    return this.setScope();
  }

  setScope(scope?: string) {
    this.#scope = parsePathToScope(scope ? scope : this.DEFAULT_SCOPE);
  }

  useColor(color: FGColor) {
    this.specifiedColor = colours.fg[color];
    return this;
  }

  color(color: FGColor) {
    this.specifiedColor = colours.fg[color];
    return this;
  }

  log(message: string, ...args: any[]) {
    this.#log("log", message, args);
  }

  debug(message: string, ...args: any[]) {
    this.#log("debug", message, args);
  }

  info(message: string, ...args: any[]) {
    this.#log("info", message, args);
  }

  warn(message: string, ...args: any[]) {
    this.#log("warn", message, args);
  }

  error(message: string, ...args: any[]) {
    this.#log("error", message, args);
  }

  #log(level: Level, message: string, args: any[]) {
    if (message) {
      let output = [
        `[${this.#scope}] ${message}`,
        ...(args.length ? args : []),
        colours.reset,
      ].filter((d) => !!d);

      switch (level) {
        case "error":
          this.#console.error(this.specifiedColor || colours.fg.red, ...output);
          break;

        case "warn":
          this.#console.warn(
            this.specifiedColor || colours.fg.yellow,
            ...output
          );
          break;

        case "info":
          this.#console.log(this.specifiedColor || colours.fg.blue, ...output);
          break;

        case "debug":
          if (this.logDebug)
            this.#console.log(
              this.specifiedColor || this.defaultColor,
              ...output
            );
          break;

        case "log":
          if (this.logDebug)
            this.#console.log(
              this.specifiedColor || this.defaultColor,
              ...output
            );
          break;

        default:
          this.#console.log(
            this.specifiedColor || this.defaultColor,
            ...output
          );
          break;
      }
      this.specifiedColor = undefined;
    }
  }
}

type LoggerOptions<T> = {
  scope?: string;
  logger?: T;
  color: FGColor;
  logDebug: boolean;
};
interface ILogger {
  log(message?: any, ...optionalParams: any[]): void;
  info(message?: any, ...optionalParams: any[]): void;
  warn(message?: any, ...optionalParams: any[]): void;
  error(message?: any, ...optionalParams: any[]): void;
}

const defaultOptions: LoggerOptions<Console> = {
  logger: console,
  color: "default",
  logDebug: true,
};

export default function <T extends ILogger>(
  options: Partial<LoggerOptions<T>> = {}
) {
  const $options = { ...defaultOptions, ...options };
  const logger = new _Logger($options.scope, $options.logger);
  logger.logDebug = $options.logDebug;
  if ($options.color) logger.setDefaultColor($options.color);
  return logger;
}
