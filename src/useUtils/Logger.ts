import path from "path";

const colours = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  fg: {
    black: "\x1b[30m",
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

export type FGColor = keyof typeof colours.fg;
export type Level = "error" | "warning" | "info" | string;
export default class _Logger {
  static _DEFAULT_SCOPE = "app";
  specifiedColor: string;
  console: any;

  static Log = new _Logger();

  static use(scope?: string) {
    console.log(">>", scope);

    _Logger.Log = new _Logger(scope);
  }

  static getLogger(scope?: string) {
    return new _Logger(scope);
  }

  static parsePathToScope(filepath: string) {
    if (filepath.indexOf(path.sep) >= 0) {
      filepath = filepath.replace(process.cwd(), "");
      filepath = filepath.replace(`${path.sep}src${path.sep}`, "");
      filepath = filepath.replace(`${path.sep}dist${path.sep}`, "");
      filepath = filepath.replace(".ts", "");
      filepath = filepath.replace(".js", "");
      filepath = filepath.replace(path.sep, ":");
    }
    return filepath;
  }

  #scope: string;

  constructor(scope?: string, _console?: any) {
    this.#scope = _Logger.parsePathToScope(
      scope ? scope : _Logger._DEFAULT_SCOPE
    );

    this.console = _console || console;
  }

  setScope(scope: string) {
    this.#scope = _Logger.parsePathToScope(
      scope ? scope : _Logger._DEFAULT_SCOPE
    );
  }

  useColor(color: FGColor) {
    this.specifiedColor = colours.fg[color];
    return this;
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
        `${this.#formatScope()} ${message}`,
        args.length ? args : undefined,
        colours.reset,
      ].filter((d) => !!d);

      if (output[0]!.includes("[app] ")) {
        output = [colours.fg.green, ...output];
      }
      switch (level) {
        case "error":
          console.error(this.specifiedColor || colours.fg.red, ...output);
          break;

        case "warn":
          console.warn(this.specifiedColor || colours.fg.yellow, ...output);
          break;

        case "info":
          console.log(this.specifiedColor || colours.fg.blue, ...output);
          break;

        default:
          console.log(this.specifiedColor || colours.reset, ...output);
          break;
      }
    }
  }

  #formatScope() {
    return `[${this.#scope}]`;
  }
}
