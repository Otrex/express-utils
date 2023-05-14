import http from "http";
import { IExpressApp, IServerConfig } from "../types";
import { log } from "console";

const defaultConfig: IServerConfig = {
  force: false,
  plugin: async () => {},
  beforeStart: async () => {},
  afterStart: async () => {},
  onShutdown: () => {},
  onStart: ({ port }) => {
    log(`Server has started @Port ${port}`);
  },
  port: +(process.env.PORT || 8000),
  basePath: "/api/v1",
  registerController: [],
};

export default class Server {
  config: IServerConfig;
  app: IExpressApp;
  server: http.Server;

  static start(
    config: Partial<IServerConfig> & {
      expressApp: IExpressApp | (() => IExpressApp);
    }
  ) {
    const { expressApp: app, ...configOptions } = config;
    const server = new Server("use" in app ? app : app());
    server.setConfig(configOptions);
    server.run();
  }

  constructor(app: IExpressApp) {
    this.config = defaultConfig;
    this.app = app;
  }

  setConfig(configOptions: Partial<IServerConfig>) {
    this.config = {
      ...this.config,
      ...configOptions,
    };
  }

  registerServerListeners() {
    this.server.on("listening", () => {
      process.on("SIGINT", (e) => {
        this.server.close(() => console.log(`Server has gracefully shut down`));

        process.exit(0);
      });
    });

    let retry = false;
    this.server.on("error", (err: any) => {
      if (!this.config.force) {
        console.error(err);
        process.exit(1);
      }

      if (err.code === "EADDRINUSE") {
        console.log(">> " + err);
        retry = true;
      }

      while (retry) {
        this.config.port += 1;
        console.log(`Testing port ${this.config.port}`);
        this.server.listen(this.config.port);
        retry = false;
      }
    });
  }

  run(...httpOptions: any[]) {
    httpOptions.unshift(this.app);
    this.server = http.createServer(...httpOptions);
    this.registerServerListeners();

    (async () => {
      await this.config.beforeStart(this.server);
      await this.config.plugin(this.app, this.server);
      this.server.listen(this.config.port, () => {
        this.config.onStart(this.config);
      });
      await this.config.afterStart(this.server);
    })().catch((err) => {
      console.log(err);
      process.exit(1);
    });
  }
}
