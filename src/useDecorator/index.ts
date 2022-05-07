import { Router } from "express";

export interface Routes { method: string, path?: string, middlewares?: any[] };
export interface IAddRoute extends Routes { validator?: any; }

export default function useDecorator (baseRoute = '') {
    const _globalMiddleware: any[] = [];
    const _routes: Routes[] = [];
    let _baseRoute = baseRoute;

    const registerRoutes = (router: Router) => {
        if (_globalMiddleware.length) router.use(..._globalMiddleware);
        for (const route of _routes) {
            (router as any).route(`${_baseRoute}${route.path}`)[route.method](...route.middlewares!);
        }
        return router
    }
    
    const globalMiddleware = (baseRoute: string = '', middlewares?: any[]) => <T extends { new (...args: any[]): {} }>(constructor: T) => {
        _baseRoute = baseRoute;
        if (middlewares) _globalMiddleware.push(...middlewares);
        return class extends constructor {}
    }

    const addRoute = (routeParams: IAddRoute) => {
        const { method, path, middlewares, validator } = routeParams;
        return  (target: any, propertyKey: string) => {
            const handler = target[propertyKey]
            
            const route: Routes = {
                middlewares: [...(middlewares || [])],
                path: path || `/${propertyKey}`,
                method,
            }

            const wrapperFn = (...args: any[]) => {
                if (validator) validator(...args)
                return handler.apply(null, args)
            }

            route.middlewares!.push(handler)
            _routes.push(route);
            Object.assign(target, { [propertyKey]: wrapperFn })
        };
    }

    return {
        globalMiddleware,
        routes: _routes,
        registerRoutes,
        addRoute,
    }
}