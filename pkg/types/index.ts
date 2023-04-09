import { RequestHandler } from "express";
import http from "http";
import _App from "../core/App";

export interface Routes {
  method: string;
  path?: string;
  middlewares?: any[];
}
export interface IAddRoute extends Routes {
  validator?: any;
  useAsyncHandler?: boolean;
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
