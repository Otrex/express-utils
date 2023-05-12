import { NextFunction, Request, Response } from "express";

export const resolveRoutePath = (path: string) => {
  return path === "index"
    ? "/"
    : path
        .split(/(?=[A-Z])/)
        .join("-")
        .toLowerCase();
};

export const isAsync = (func: Function) =>
  func.constructor.name === "AsyncFunction";

export const asyncWrapper =
  (handler: any) =>
  async (...args: Array<Request | Response | NextFunction>) => {
    try {
      await handler.apply(null, args);
    } catch (error) {
      const next = args[args.length - 1] as NextFunction;
      next(error);
    }
  };
export const wrapper =
  (handler: any) =>
  (...args: Array<Request | Response | NextFunction>) => {
    try {
      return handler.apply(null, args);
    } catch (error) {
      const next = args[args.length - 1] as NextFunction;
      next(error);
    }
  };
