import http from "http";
import { EventEmitter } from "events";
import Router from "./Router";
import { Logger } from "..";

const logger = Logger.getLogger("app.server");

export interface PartialsSetupFunction<
  T extends http.ServerOptions | Record<string, any>
> {
  (ctx: { httpServer: http.Server; plugin: T; self: _App<T> }): void;
}

export interface SetupFunction<
  T extends http.ServerOptions | Record<string, any>
> {
  (ctx: { httpServer: http.Server; plugin: T; self: _App<T> }): Promise<void>;
}

export interface RunOptions<
  T extends http.ServerOptions | Record<string, any>
> {
  port?: number;
  setup?: SetupFunction<T>;
  shutdown?: (server: http.Server) => NodeJS.SignalsListener;
  afterSetup?: PartialsSetupFunction<T>;
  callback?: Function;
  forceStart?: boolean;
}

const defaultOptions = {
  port: 3000,
  setup: async (ctx: any) => {},
  callback: (port: number) => {
    logger.useColor("green");
    logger.info("-----------------------------------------------");
    logger.info(`\u{1F6EB} Server started @PORT=${port}`);
    logger.info("-----------------------------------------------\n");
  },
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

  partial(fnc: PartialsSetupFunction<T>) {
    fnc({
      httpServer: this._httpServer,
      plugin: this._app,
      self: this,
    });
    return this;
  }

  addHandler(app: T, httpOptions: any[] = []) {
    this._httpServer = http.createServer(app, ...httpOptions);
    this._app = app;
    return this;
  }

  beforeStart(setupFnc: SetupFunction<T>) {
    this._setup = setupFnc;
    return this;
  }

  afterStart(setupFnc: SetupFunction<T>) {
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
      shutdown,
      afterSetup,
      forceStart = false,
      httpListenOptions = [],
    } = {
      ...defaultOptions,
      ...options,
    };

    this._port = isNaN(+port) ? 8000 : +port;
    this._setup = this._setup || setup;
    this._asetup = this._asetup || afterSetup;

    this.addListener("ready", () => {
      let retry = false;
      this._httpServer.listen(this._port, ...httpListenOptions);

      this._httpServer.on("listening", () => {
        callback(this._port);
        this._asetup &&
          this._asetup({
            httpServer: this._httpServer,
            plugin: this._app,
            self: this,
          }).catch((err) => this.emit("after-start-error", err));

        const die = shutdown
          ? shutdown(this._httpServer)
          : (...any: any[]) => {};

        process.on("SIGINT", (e) => {
          die(e);
          this._httpServer.close(() =>
            logger.info(`Server has gracefully shut down`)
          );
        });
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

    this._setup({
      httpServer: this._httpServer,
      plugin: this._app,
      self: this,
    })
      .then(() => this.emit("ready"))
      .catch((err) => {
        this.emit("before-start-error", err);
        console.error(err);
        process.exit(1);
      });
  }
}
