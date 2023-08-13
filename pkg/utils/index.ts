import { NextFunction, Request, Response } from "express";
import { RouteValue } from "../types";
import { colours as colors } from "../core/Logger";
import path from "path";

export const printTopic = (
  route: RouteValue,
  constructorName: string,
  basePath: string
) => {
  const { path, method, name } = route;
  console.log(
    colors.fg.green,
    `- ${constructorName}.${name} => ${method.toUpperCase()} ${
      basePath === "/" ? "" : basePath
    }${path}`,
    colors.fg.white
  );
};

export function sortPaths(sample: string[]) {
  return sample
    .map(e => [e.split("/"), e] as [string[], string])
    .sort((a, b) => b[0].length - a[0].length)
    .map((el, idx) => {
      const variablePathIdx = el[0].findIndex((e) => e.includes(":"))
      return [
        variablePathIdx === -1 
        ? sample.length 
        : variablePathIdx, 
        el[1]
      ] as [number, string];
    }).sort((a, b) => {
      return b[0] - a[0];
    }).map(e => e[1])
  }


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
