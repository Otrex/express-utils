import { Request, RequestHandler, Router } from "express";
import { ClassConstructor, IAfterEach, KeyOf, Middleware, ParamHandler, ParameterConfig, RouteValue, SupportedMethods } from "../types";
import { _APIResponse, success } from "./ApiResponse";
import { printTopic, resolveRoutePath, catchMiddlewareError as CME } from "../utils";

type RequestAttrs = KeyOf<Request>;
type RequestExtractorParams = `${string}.${string}`

type UseHandler = {
  path?: string;
  handlers: Middleware | Middleware[];
};

interface GlobalMiddlewareOptions {
  basePath?: string;
  validate?: Function;
  paramHandlers?: ParamHandler,
  after: IAfterEach;
  use: (UseHandler | Middleware)[];
  globalUse: (UseHandler | Middleware)[];
}

type Routes = Record<string, RouteValue>;

export default function () {
  let $$target: any;
  let $$validate: Function | undefined;
  let $$paramHandler: ParamHandler | undefined;
  let $$globals: GlobalMiddlewareOptions = {
    after: () => { },
    use: [],
    globalUse: []
  };


  const $$routes: Routes = {};

  function Controller(opts: Partial<GlobalMiddlewareOptions> = {}) {
    return <T extends ClassConstructor>(constructor: T, ...args: any[]) => {
      const { validate, paramHandlers, ...options } = opts;
      $$target = constructor;
      $$validate = validate;
      $$paramHandler = paramHandlers || {}
      $$globals = {
        ...$$globals,
        ...options,
        use: [...$$globals.use, ...(options.use || [])],
      };
      return class extends constructor { };
    };
  }

  function AfterEach(handler: IAfterEach) {
    return <T extends ClassConstructor>(constructor: T, ...args: any[]) => {
      $$globals = {
        ...$$globals,
        after: handler,
      };
      return class extends constructor { };
    };
  }


  function Middlewares(middlewares: Middleware[] | Middleware) {
    return function (target: any, key: string, descriptor: PropertyDescriptor) {
      $$routes[key] = {
        ...($$routes[key] || {}),
        name: key,
        middlewares: Array.isArray(middlewares) ? middlewares : [middlewares],
      };

      return descriptor;
    };
  }


  function $$MethodDecoratorFactory(method: SupportedMethods) {
    return function (path?: string) {
      return function (
        target: any,
        key: string,
        descriptor: PropertyDescriptor,
      ) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
          return originalMethod.apply(this, args);
        };

        $$routes[key] = {
          ...($$routes[key] || {}),
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
    Use: Middlewares,
    Controller,
  };

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

  const Session = (props: string = "") => ReqExtract(`session.${props}`);

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
    Session,
    ReqExtract,
    File: ReqExtract('file.'),
    Files: ReqExtract('files.'),
    User: ReqExtract("session.user"),
  };

  const BaseController = class _controller {
    __basePath?: string;
    success = success;
    validate = $$validate;
    message: (message: string, statusCode?: number) => void;
    config: { get: (s: string, _d?: any) => any, [key: string]: any };
    respondWith: (data: any, statusCode?: number) => void;
    private __router: Router;

    get router() {
      return this.__router;
    }

    constructor() {
      this.__setup();
      this.__router = Router()
    }

    __invoke() { }
    __setup() { }

    __use(...middleware: RequestHandler[]) {
      this.__router.use(middleware)
    }

    static $register() {
      if (!$$target) $$target = this
      return RegisterRoutes();
    }
  };


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

  function RegisterRoutes() {
    const $router = Router();
    const $target = new $$target();
    $target.config = (global as any).config;

    const basePath = ($$globals && $$globals.basePath) || $target.__basePath || "/";

    for (let key in $$paramHandler) {
      $target.router.param(key, CME($$paramHandler[key]))
    }

    Object.values($$routes).forEach((d) => {
      printTopic(d, $$target.name, basePath);
      $target.router[d.method](
        d.path,
        ...([
          ...$$globals.use,
          ...(d.middlewares ? d.middlewares : []),
          async (request, response, next) => {
            try {

              $target.respondWith = (data: any, statusCode = 200) => {
                return success(response, data, statusCode)
              }

              $target.message = (message: string, statusCode = 200) => {
                return success(response, { message }, statusCode)
              }

              const ctx = { request, response, next };
              const args: any[] = [];

              d.parametersConfig?.forEach((param) => {
                args[param.index] = resolver(param, ctx, args[param.index]);
              });

              if (d.parametersConfig?.length) args.push(ctx);
              else args.unshift(ctx);

              const result = await $target[d.name](...args);
              await $target.__invoke(result)

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

    // $$globals.use.push({
    //   path: basePath,
    //   handlers: router,
    // });

    $$globals.globalUse.forEach((m) => {
      if ("path" in m) $router.use(m.path!, m.handlers as any);
      else $router.use(m as Middleware);
    });

    $router.use(basePath, $target.router);

    return $router;
  }

  return {
    P,
    Http,
    ...Http,
    ...P,
    Use: Middlewares,
    BaseController,
    Controller,
    AfterEach,
    RegisterRoutes,
  };
}
