import { NextFunction, Router } from "express";

export interface Routes { method: string, path?: string, middlewares?: any[] };
export interface IAddRoute extends Routes { validator?: any; useAsyncHandler?: boolean }

const resolveRoutePath = (path: string) => path.split(/(?=[A-Z])/).join('-').toLowerCase(); 

export default function (baseRoute = '') {
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

    const asyncHandler = (controller: (...args: any[]) => any) => {
        return async (req: any, res: any, next: NextFunction) => {
            try {
                await controller(req, res, next)
            } catch (error) {
                next(error)
            }
        }
    }

    const addRoute = (routeParams: IAddRoute) => {
        const { method, path, middlewares, validator, useAsyncHandler } = routeParams;
        return  (target: any, propertyKey: string) => {
            const handler = target[propertyKey]
            
            const route: Routes = {
                middlewares: [...(middlewares || [])],
                path: path || `/${resolveRoutePath(propertyKey)}`,
                method,
            }

            const wrapperFn = (...args: any[]) => {
                if (validator) validator(...args)
                return handler.apply(null, args)
            }

            const $wrapperFn = useAsyncHandler ? asyncHandler(wrapperFn) : wrapperFn

            route.middlewares!.push($wrapperFn)
            _routes.push(route);
            Object.assign(target, { [propertyKey]: $wrapperFn })
        };
    }

    const Controller = () => {
        return class _controller {
            static registerRoutes = registerRoutes
            static asyncHandler = asyncHandler
            static addRoute = addRoute
            static routes = _routes
        }
    }

    return {
        Controller: Controller(),
        globalMiddleware,
        routes: _routes,
        registerRoutes,
        asyncHandler,
        addRoute,
    }
}