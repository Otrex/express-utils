import { Request, Router, RouterOptions } from "express";
import { ClassConstructor, IAfterEach, KeyOf, Middleware } from "../types";
import { _APIResponse, success } from "./ApiResponse";
import { resolveRoutePath } from "../utils";
import { colours } from "./Logger";

type RequestAttrs = KeyOf<Request>;
type RequestExtractorParams = `${string}.${string}`

type UseHandler = {
  path?: string;
  handlers: Middleware | Middleware[];
};

type SupportedMethods = "get" | "all" | "post" | "put" | "delete" | "patch";

interface GlobalMiddlewareOptions {
  basePath: string;
  after: IAfterEach;
  use: (UseHandler | Middleware)[];
}
type ParameterConfig = {
  index: number;
  action: string;
  runner?: Function;
};

type RouteValue = {
  name: string;
  method: SupportedMethods;
  path: string;
  middlewares: Middleware[];
  parametersConfig: Array<ParameterConfig>;
};

type Routes = Record<string, RouteValue>;

const printTopic = (
  route: RouteValue,
  constructorName: string,
  basePath: string
) => {
  const { path, method, name } = route;
  console.log(
    colours.fg.green,
    `${constructorName}.${name} => ${method.toUpperCase()} ${
      basePath === "/" ? "" : basePath
    }${path}`,
    colours.fg.white
  );
};

export default function () {
  let $$target: any;
  let $$globals: GlobalMiddlewareOptions = {
    basePath: "/",
    after: () => {},
    use: [],
  };

  const $$routes: Routes = {};

  function Controller(options: Partial<GlobalMiddlewareOptions> = {}) {
    return <T extends ClassConstructor>(constructor: T) => {
      $$target = constructor;
      $$globals = {
        ...$$globals,
        ...options,
        use: [...$$globals.use, ...(options.use || [])],
      };
      return class extends constructor {};
    };
  }

  function AfterEach(handler: IAfterEach) {
    return <T extends ClassConstructor>(constructor: T) => {
      $$globals = {
        ...$$globals,
        after: handler,
      };
      return class extends constructor {};
    };
  }

  const BaseController = (routerCreator: (m?: RouterOptions) => Router) => {
    return class _controller {
      success = success;
      router: Router;
      respondWith: (data: any, statusCode?: number) => void;

      static $register() {
        return RegisterRoutes(routerCreator);
      }
    };
  };

  function $$MethodDecoratorFactory(method: SupportedMethods) {
    return function (path?: string) {
      return function (
        target: any,
        key: string,
        descriptor: PropertyDescriptor
      ) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
          return originalMethod.apply(this, args);
        };

        $$routes[key] = {
          ...($$routes[key] || {}),
          middlewares: [],
          name: key,
          method,
          path: path || `/${resolveRoutePath(key)}`,
        };

        return descriptor;
      };
    };
  }

  const Http = {
    Get: $$MethodDecoratorFactory("get"),
    Put: $$MethodDecoratorFactory("put"),
    Post: $$MethodDecoratorFactory("post"),
    Patch: $$MethodDecoratorFactory("patch"),
    Delete: $$MethodDecoratorFactory("delete"),
    Middlewares,
    Controller,
  };

  function Middlewares(middlewares: Middleware[]) {
    return function (target: any, key: string, descriptor: PropertyDescriptor) {
      $$routes[key] = {
        ...($$routes[key] || {}),
        name: key,
        middlewares,
      };

      return descriptor;
    };
  }

  function $$ParameterDecoratorFactory(action: string, runner?: Function) {
    return function (target: any, key: string, index: number) {
      $$routes[key] = {
        ...$$routes[key],
        parametersConfig: [
          ...(($$routes[key] && $$routes[key].parametersConfig) || []),
          { index, action, runner },
        ],
      };
    };
  }

  const $$SubRequestParameterDecoratorFactory = (
    attr: RequestAttrs,
    field?: string
  ) => {
    return field
      ? $$ParameterDecoratorFactory("runner-req", (req: Request) => {
          return req[attr] && req[attr][field];
        })
      : $$ParameterDecoratorFactory("runner-req", (req: Request) => {
          return req[attr];
        });
  };

  const Req = $$ParameterDecoratorFactory("request");
  const Res = $$ParameterDecoratorFactory("response");
  const Next = $$ParameterDecoratorFactory("next");
  const Params = (field?: string) =>
    $$SubRequestParameterDecoratorFactory("params", field);
  const Body = (field?: string) =>
    $$SubRequestParameterDecoratorFactory("body", field);
  const Query = (field?: string) =>
    $$SubRequestParameterDecoratorFactory("query", field);

  const ReqExtract = (extract: RequestExtractorParams) => {
    const [requestField, field] = extract.split(".") as [RequestAttrs, string];
    return $$SubRequestParameterDecoratorFactory(requestField, field);
  }

  /**
   * this
   * @param cb
   * @returns
   */
  const Pipe = (cb: Function) => $$ParameterDecoratorFactory("pipe", cb);

  const P = {
    Req,
    Res,
    Next,
    Params,
    Pipe,
    Body,
    Query,
    ReqExtract
  };

  function RegisterRoutes(routerCreator: (m?: RouterOptions) => Router) {
    const wrapperRouter = routerCreator();
    const router = routerCreator();

    const $target = new $$target();
    $target.router = wrapperRouter;

    const basePath = ($$globals && $$globals.basePath) || "/";

    const resolver = (
      dparams: ParameterConfig,
      ctx: Record<string, any>,
      arg: any
    ) => {
      if (dparams.action in ctx) return ctx[dparams.action];
      if (dparams.action === "pipe")
        return dparams.runner && dparams.runner(arg);
      if (dparams.action === "runner-req")
        return dparams.runner && dparams.runner(ctx.request);
    };

    Object.values($$routes).forEach((d) => {
      printTopic(d, $$target.name, basePath);
      router[d.method](
        d.path,
        ...([
          ...d.middlewares,
          async (request, response, next) => {
            try {
              const ctx = { request, response, next };
              const args: any[] = [];

              d.parametersConfig?.forEach((param) => {
                args[param.index] = resolver(param, ctx, args[param.index]);
              });

              if (d.parametersConfig?.length) args.push(ctx);
              else args.unshift(ctx);

              $target.respondWith = (data: any, statusCode: number = 200) => {
                return success(response, data, statusCode)
              }

              const result = await $target[d.name](...args);

              Promise.all([
                $$globals.after({
                  name: d.name,
                  method: d.method,
                  controller: $$target.name,
                  response: result,
                }),
              ]).catch(console.error);

              if (!response.headersSent) return success(response, result);
            } catch (e) {
              next(e);
            }
          },
        ] as Middleware[])
      );
    });

    $$globals.use.push({
      path: basePath,
      handlers: router,
    });

    $$globals.use.forEach((m) => {
      if ("path" in m) wrapperRouter.use(m.path!, m.handlers as any);
      else wrapperRouter.use(m as Middleware);
    });

    return wrapperRouter;
  }

  return {
    P,
    Http,
    ...Http,
    ...P,
    Middlewares,
    BaseController,
    Controller,
    AfterEach,
    RegisterRoutes,
  };
}
