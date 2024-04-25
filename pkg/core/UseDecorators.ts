import {
  Response,
  Router,
  RouterOptions,
} from "express";
import { IAddRoute, Middleware, Routes } from "../types";
import { _APIResponse } from "./ApiResponse";
import { asyncWrapper, isAsync, resolveRoutePath, wrapper } from "../utils";

interface ClassConstructor {
  new (...args: any[]): {};
}

type UseHandler = {
  path?: string;
  handlers: Middleware[];
};

type GlobalOptions = {
  path?: string;
  middlewares?: Middleware[];
  use?: UseHandler[];
};

/**
  A Controller Factory function that returns a router with added routes and middlewares.
  @function
  @param {string} [baseRoute=""] - Base route for all the routes inside the controller.
  @returns {{ Controller, globalMiddleware, routes, registerRoutes, asyncHandler, addRoute, success }} - An object containing functions and properties for adding routes and middlewares.
*/
export default function (baseRoute = "", validator?: Function) {
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
   * @param {express.Router} router
   * @returns {express.Router}
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
          .route(`${_baseRoute}${route.path}`.replace("//", "/"))
          [route.method](...route.middlewares!);

        console.log("Registered::", route.path, route.method);
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
   *  Adds a new route to the server.
   *  @param {Object} routeParams - Route parameters.
   *  @param {Function} routeParams.validator - Optional validator middleware.
   *  @param {boolean} routeParams.useAsyncHandler - Whether to use async handler.
   *  @param {string} routeParams.method - HTTP method of the route.
   *  @param {string} routeParams.path - URL path of the route.
   *  @param {Array<Function>} routeParams.middlewares - Optional array of middlewares.
   *  @returns {void}
   */
  const AddRoute = (routeParams: IAddRoute) => {
    const { method, path, middlewares, validator } = routeParams;
    return (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) => {
      const handler = descriptor.value;

      const $path =
        path ||
        (propertyKey.toLowerCase() === "index"
          ? "/"
          : `/${resolveRoutePath(propertyKey)}`);

      const route: Routes = {
        middlewares: [...(middlewares || [])],
        path: $path,
        method,
      };

      RouterPartials(route, handler, target, propertyKey);
    };
  };

  const MethodFactory =
    (method: string) =>
    (path?: string, middlewares: Middleware[] = []) => {
      return (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
      ) => {
        const handler = descriptor.value;

        const $path =
          path ||
          (propertyKey.toLowerCase() === "index"
            ? "/"
            : `/${resolveRoutePath(propertyKey)}`);
        const route: Routes = {
          middlewares: [...(middlewares || [])],
          path: $path,
          method,
        };

        RouterPartials(route, handler, target, propertyKey);
      };
    };

  /**

    This decorator is for the GET method.
    @function
    @param {string} path - URL path of the route.
    @param {Array<Function>} middlewares - Optional array of middlewares.
    @returns {void}
  */
  const Get = MethodFactory("get");

  /**

    This decorator is for the DELETE method.
    @function
    @param {string} path - URL path of the route.
    @param {Array<Function>} middlewares - Optional array of middlewares.
    @returns {void}
  */
  const Delete = MethodFactory("delete");

  /**
    This decorator is for the POST method.
    @function
    @param {string} path - URL path of the route.
    @param {Array<Function>} middlewares - Optional array of middlewares.
    @returns {void}
  */
  const Post = MethodFactory("post");

  /**
    This decorator is for the PATCH method.
    @function
    @param {string} path - URL path of the route.
    @param {Array<Function>} middlewares - Optional array of middlewares.
    @returns {void}
  */
  const Patch = MethodFactory("patch");

  /**
    This decorator is for the PUT method.
    @function
    @param {string} path - URL path of the route.
    @param {Array<Function>} middlewares - Optional array of middlewares.
    @returns {void}
  */
  const Put = MethodFactory("put");

  const Controller = (
    routerCreator: (m?: RouterOptions) => Router,
    options: RouterOptions = {}
  ) => {
    const router = routerCreator(options);

    return class _controller {
      registerRoutes = () => RegisterRoutes(router);
      Success = Success;
    };
  };

  return {
    GlobalMiddleware,
    routes: _routes,
    RegisterRoutes,
    Controller,
    AddRoute,
    Success,
    Delete,
    Patch,
    Post,
    Put,
    Get,
  };
}
