export default class _Router {
  static setHandler<T extends Record<string, any>>(
    handler: () => T,
    globalMiddleware = [],
    injectorMethod = "use"
  ) {
    const INJECTOR_METHOD = injectorMethod;
    const HANDLER = handler;
    const ROUTER_LIST: any[] = [];

    return {
      group: function (...args: (string | ((r?: T, m?: T) => void))[]) {
        const temp = [...args];
        const handler = temp.pop() as (r: T, m?: T) => void;

        const routerMain = HANDLER();
        const routerGroup = HANDLER();

        handler(routerGroup, routerMain);
        routerMain[INJECTOR_METHOD](...[...temp, routerGroup]);
        ROUTER_LIST.push(routerMain);

        // console.log(`Registered router: ${ROUTER_LIST.length} :: ${typeof temp[0] === "string" ? temp[0]: ''}`);
      },
      getRouter: function () {
        const router = HANDLER();
        globalMiddleware.forEach((middleware) => {
          router[INJECTOR_METHOD](middleware);
        });

        ROUTER_LIST.forEach((r) => {
          router[INJECTOR_METHOD](r);
        });
        return router;
      },
    };
  }
}
