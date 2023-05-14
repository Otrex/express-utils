import { NextFunction, Request, Response } from "express";
import path from "path";

export const resolveRoutePath = (path: string) => {
  return path === "index"
    ? ""
    : path
        .split(/(?=[A-Z])/)
        .join("-")
        .toLowerCase();
};
export function getFileNameWithoutExtension(filePath: string) {
  const { name, ext } = path.parse(filePath);
  return name;
}

export function parsePathToScope(filepath: string) {
  return path.join(getFileNameWithoutExtension(filepath));
}

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