import http from "http";
import { EventEmitter } from "events";
import Router from "./Router";
import { Logger } from "..";

const logger = Logger.getLogger("app.server");
interface SetupFunction<T> {
  (h?: http.Server, a?: T): Promise<void>;
}
interface RunOptions<T = any> {
  port?: number;
  setup?: SetupFunction<T>;
  callback?: Function;
  forceStart?: boolean;
}
const defaultOptions = {
  port: 3000,
  setup: async () => {},
  callback: (port: number) => {
    logger.useColor("green")
    logger.info("-----------------------------------------------");
    logger.info(`\u{1F6EB} Server started @PORT=${port}`);
    logger.info("-----------------------------------------------\n");
  }
};

export default class _App<
  T extends http.ServerOptions | Record<string, any>
> extends EventEmitter {
  _port = 0;
  _app: T;
  _setup: SetupFunction<T>;
  _asetup: SetupFunction<T>;
  _isReady = false;
  _httpServer: http.Server;
  _partialFnc = null;

  static createServer<T extends http.ServerOptions | Record<string, any>>(
    app: T,
    ...httpOptions: any[]
  ) {
    const appInstance = new _App();
    appInstance.addHandler(app, httpOptions);
    return appInstance;
  }

  static plugin<T extends http.ServerOptions | Record<string, any>>(
    plugs: { [key: string]: () => T } = {},
    ...httpOptions: any[]
  ) {
    const appInstance = new _App<T>();

    for (const [name, plug] of Object.entries(plugs)) {
      if (name == "express") {
        appInstance.addHandler(plug(), httpOptions);
      }
    }

    return appInstance;
  }

  pluginConfig(config: Record<string, any> = {}) {
    for (const method in config) {
      if (typeof (this._app as any)[method] === "function") {
        for (const ware of config[method]) {
          if (typeof ware === "function") {
            (this._app as any)[method](ware);
          }
          if (Array.isArray(ware)) {
            (this._app as any)[method](...ware);
          }

          if ("getRouter" in ware) {
            (this._app as any)[method](ware.getRouter());
          }
        }
      }
    }

    return this;
  }

  partial(fnc = (app: T, httpServer: http.Server): void => {}) {
    fnc(this._app, this._httpServer);
    return this;
  }

  addHandler(app: T, httpOptions: any[] = []) {
    this._httpServer = http.createServer(app, ...httpOptions);
    this._app = app;
    return this;
  }

  beforeStart(setupFnc = async () => {}) {
    this._setup = setupFnc;
    return this;
  }

  afterStart(setupFnc = async () => {}) {
    this._asetup = setupFnc;
    return this;
  }

  getHttpServer(): http.Server {
    return this._httpServer;
  }

  run(options: RunOptions<T> = {}) {
    const {
      port,
      callback,
      setup,
      forceStart = false,
      httpListenOptions = [],
    } = {
      ...defaultOptions,
      ...options,
    };

    this._port = isNaN(+port) ? 8000 : +port;
    this._setup = this._setup || setup;

    this.addListener("ready", () => {
      let retry = false;
      this._httpServer.listen(this._port, ...httpListenOptions);

      this._httpServer.on("listening", () => {
        callback(this._port);
        this._asetup &&
          this._asetup().catch((err) => this.emit("after-start-error", err));
      });

      this._httpServer.on("error", (err: Error & { code: string }) => {
        if (err.code === "EADDRINUSE" && forceStart) {
          console.log("Error: " + err);
          retry = true;
        }

        if (!forceStart) {
          console.error(err);
          process.exit(1);
        }

        while (retry) {
          this._port += 1;
          console.log(`Testing port ${this._port}`);
          this._httpServer.listen(this._port);
          retry = false;
        }
      });
    });

    this._setup(this._httpServer, this._app)
      .then(() => this.emit("ready"))
      .catch((err) => {
        this.emit("before-start-error", err);
        console.error(err);
        process.exit(1);
      });
  }
}
