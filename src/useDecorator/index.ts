import {
  NextFunction,
  Request,
  Response,
  Router,
  RouterOptions,
  RequestHandler,
} from "express";
import { _APIResponse } from "../useUtils/ApiResponse";

export interface Routes {
  method: string;
  path?: string;
  middlewares?: any[];
}
export interface IAddRoute extends Routes {
  validator?: any;
  useAsyncHandler?: boolean;
}

interface ClassConstructor {
  new (...args: any[]): {};
}

export type Middleware = RequestHandler | RequestHandler[];

type UseHandler = {
  path?: string;
  handlers: Middleware[];
};

type GlobalOptions = {
  path?: string;
  middlewares?: Middleware[];
  use?: UseHandler[];
};

const resolveRoutePath = (path: string) =>
  path
    .split(/(?=[A-Z])/)
    .join("-")
    .toLowerCase();
const isAsync = (func: Function) => func.constructor.name === "AsyncFunction";

const asyncWrapper =
  (handler: any) =>
  async (...args: Array<Request | Response | NextFunction>) => {
    try {
      await handler(...args);
    } catch (error) {
      const next = args[args.length - 1] as NextFunction;
      next(error);
    }
  };
const wrapper =
  (handler: any) =>
  (...args: Array<Request | Response | NextFunction>) => {
    try {
      return handler.apply(null, args);
    } catch (error) {
      const next = args[args.length - 1] as NextFunction;
      next(error);
    }
  };
/**
 * This is the `useDecorate` function that creates decorators for the controller
 * @param baseRoute string
 * @returns - { Controller, globalMiddleware, routes, registerRoutes, asyncHandler, addRoute, success }
 */
export default function (baseRoute = "") {
  const _globalMiddleware: Middleware[] = [];
  const _routes: { [key: string]: Routes[] } = {};
  const _useHandlers: UseHandler[] = [];
  let _baseRoute = baseRoute;

  const RouterPartials = (
    route: Routes,
    handler: any,
    target: any,
    propertyKey: string
  ) => {
    const wrappedHandler = isAsync(handler)
      ? asyncWrapper(handler)
      : wrapper(handler);

    route.middlewares!.push(wrappedHandler);

    if (!(route.method in _routes)) {
      _routes[route.method] = [];
    }

    _routes[route.method].push(route);

    Object.assign(target, { [propertyKey]: wrappedHandler });
  };

  const Success = <T extends Record<string, any>>(
    res: Response,
    data: T,
    status = 200
  ) => {
    const _data = {
      state: "success",
      timestamp: Date.now(),
      ...data,
    };
    return new _APIResponse(status, _data).send(res);
  };

  /**
   * This registers all the routes created
   * @param router express.Router
   * @returns express.Router
   */
  const RegisterRoutes = (router: Router) => {
    if (_useHandlers.length)
      _useHandlers.map((args) => {
        if (args.path)
          router.use(`${_baseRoute}${args.path}`, ...(args.handlers as any));
        else router.use(...args.handlers);
      });
    if (_globalMiddleware.length) router.use(..._globalMiddleware);

    Object.entries(_routes).forEach(([_, routes]) => {
      routes.forEach((route) => {
        (router as any)
          .route(`${_baseRoute}${route.path}`)
          [route.method](...route.middlewares!);
      });
    });

    return router;
  };

  /**
   * This registers a global middleware for the controller
   * @param baseRoute - string - default: ''
   * @param middlewares - Middleware[]
   * @returns contructor
   */
  const GlobalMiddleware =
    (options: GlobalOptions) =>
    <T extends ClassConstructor>(constructor: T) => {
      const { path: baseRoute, middlewares, use } = options;
      if (baseRoute) _baseRoute = baseRoute;
      if (middlewares) _globalMiddleware.push(...middlewares);
      if (use) _useHandlers.push(...use);
      return class extends constructor {};
    };

  /**
   * This is used to add the routes
   * @param routeParams {
   *  validator?: Middleware;
   *  useAsyncHandler?: boolean,
   *  method: string,
   *  path?: string,
   *  middlewares?: Middleware[]
   * }
   * @returns void
   */
  const AddRoute = (routeParams: IAddRoute) => {
    const { method, path, middlewares, validator, useAsyncHandler } =
      routeParams;
    return (target: any, propertyKey: string) => {
      const handler = target[propertyKey];

      const route: Routes = {
        middlewares: [...(middlewares || [])],
        path: path || `/${resolveRoutePath(propertyKey)}`,
        method,
      };

      RouterPartials(route, handler, target, propertyKey);
    };
  };

  /**
   * This decorator is for the get method
   * @param path string
   * @param middlewares
   * @returns
   */
  const Get = (path?: string, middlewares: Middleware[] = []) => {
    return (target: any, propertyKey: string) => {
      const handler = target[propertyKey];

      const route: Routes = {
        middlewares: [...middlewares],
        path: path || `/${resolveRoutePath(propertyKey)}`,
        method: "get",
      };

      RouterPartials(route, handler, target, propertyKey);
    };
  };

  /**
   * This decorator is for the POST method
   * @param path string
   * @param middlewares
   * @returns
   */
  const Post = (path?: string, middlewares: Middleware[] = []) => {
    return (target: any, propertyKey: string) => {
      const handler = target[propertyKey];

      const route: Routes = {
        middlewares: [...middlewares],
        path: path || `/${resolveRoutePath(propertyKey)}`,
        method: "post",
      };

      RouterPartials(route, handler, target, propertyKey);
    };
  };

  /**
   * This decorator is for the PATCH method
   * @param path string
   * @param middlewares
   * @returns
   */
  const Patch = (path?: string, middlewares: Middleware[] = []) => {
    return (target: any, propertyKey: string) => {
      const handler = target[propertyKey];

      const route: Routes = {
        middlewares: [...middlewares],
        path: path || `/${resolveRoutePath(propertyKey)}`,
        method: "patch",
      };

      RouterPartials(route, handler, target, propertyKey);
    };
  };

  /**
   * This decorator is for the PUT method
   * @param path string
   * @param middlewares
   * @returns
   */
  const Put = (path?: string, middlewares: Middleware[] = []) => {
    return (target: any, propertyKey: string) => {
      const handler = target[propertyKey];

      const route: Routes = {
        middlewares: [...middlewares],
        path: path || `/${resolveRoutePath(propertyKey)}`,
        method: "put",
      };

      RouterPartials(route, handler, target, propertyKey);
    };
  };

  const Controller = (
    routerCreator: (m?: RouterOptions) => Router,
    options: RouterOptions = {}
  ) => {
    const router = routerCreator(options);

    return class _controller {
      static registerRoutes = () => RegisterRoutes(router);
    };
  };

  return {
    GlobalMiddleware,
    routes: _routes,
    RegisterRoutes,
    Controller,
    AddRoute,
    Success,
    Patch,
    Post,
    Put,
    Get,
  };
}
