import express, {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from "express";
import http from "http";
import _App from "../core/App";

export interface Routes {
  method: string;
  path?: string;
  middlewares?: any[];
}

export type IAfterEach = (ctx: {
  name: string;
  method: string;
  controller: string;
  response: any;
}) => void | Promise<void>;

export interface IAddRoute extends Routes {
  validator?: any;
  useAsyncHandler?: boolean;
}

export interface Context<T = Request> {
  request: T;
  response: Response;
  next: NextFunction;
}

export type KeyOf<T> = keyof T;

export interface ClassConstructor {
  new (...args: any[]): {};
}

export type Middleware = RequestHandler | RequestHandler[];

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

export interface IBaseController extends ClassConstructor {
  register: () => Router;
}

export type IExpressApp = ReturnType<typeof express>;
export type HTTPSever = http.Server<
  typeof http.IncomingMessage,
  typeof http.ServerResponse
>;

export interface IServerConfig {
  force: boolean;
  plugin: (app: IExpressApp, http: HTTPSever) => void;
  beforeStart: (app: HTTPSever) => void | Promise<void>;
  afterStart: (app: HTTPSever) => void | Promise<void>;
  onShutdown: (app: HTTPSever) => void;
  onStart: (config: IServerConfig) => void;
  registerController: Array<IBaseController>;
  port: number;
  basePath: string;
}
