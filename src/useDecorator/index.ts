import { NextFunction, Request, Response, Router } from "express";
import { _APIResponse } from "../useUtils/ApiResponse";

export interface Routes { method: string, path?: string, middlewares?: any[] };
export interface IAddRoute extends Routes { validator?: any; useAsyncHandler?: boolean }
export type Middleware = (...args: Array<Request|Response|NextFunction| Record<string, any>>) => any;

const resolveRoutePath = (path: string) => path.split(/(?=[A-Z])/).join('-').toLowerCase(); 

/**
 * This is the `useDecorate` function that creates decorators for the controller
 * @param baseRoute string
 * @returns - { Controller, globalMiddleware, routes, registerRoutes, asyncHandler, addRoute, success }
 */
export default function (baseRoute = '') {
    const _globalMiddleware: Middleware[] = [];
    const _routes: { [key: string]: Routes[] } = {};
    let _baseRoute = baseRoute;

    const success = <T extends Record<string, any>>(res: Response, data: T, status = 200) => {
        return new _APIResponse(status, data).send(res);
    }

    /**
     * This registers all the routes created
     * @param router express.Router
     * @returns express.Router
     */
    const registerRoutes = (router: Router) => {
        if (_globalMiddleware.length) router.use(..._globalMiddleware);

        Object.entries(_routes).forEach(([_, routes]) => {
            routes.forEach((route) => {
                (router as any).route(`${_baseRoute}${route.path}`)[route.method](...route.middlewares!);
            })
        })
        // for (const route of _routes) {
        //     (router as any).route(`${_baseRoute}${route.path}`)[route.method](...route.middlewares!);
        // }
        return router
    }
    
    /**
     * This registers a global middleware for the controller
     * @param baseRoute - string - default: ''
     * @param middlewares - Middleware[]
     * @returns contructor
     */
    const globalMiddleware = (baseRoute = '', middlewares?: Middleware[]) => <T extends { new (...args: any[]): {} }>(constructor: T) => {
        _baseRoute = baseRoute;
        if (middlewares) _globalMiddleware.push(...middlewares);
        return class extends constructor {}
    }

    /**
     * This handles catching async error and moving them to the next handler
     * @param controller 
     * @returns void
     */
    const asyncHandler = (controller: Middleware) => {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                await controller(req, res, next)
            } catch (error) {
                next(error)
            }
        }
    }

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
    const addRoute = (routeParams: IAddRoute) => {
        const { method, path, middlewares, validator, useAsyncHandler } = routeParams;
        return  (target: any, propertyKey: string) => {
            const handler = target[propertyKey]
            
            const route: Routes = {
                middlewares: [...(middlewares || [])],
                path: path || `/${resolveRoutePath(propertyKey)}`,
                method,
            }

            const wrapperFn = (...args: Array<Request|Response|NextFunction>) => {
                if (validator) validator(...args)
                return handler.apply(null, args)
            }

            const $wrapperFn = useAsyncHandler ? asyncHandler(wrapperFn) : wrapperFn

            route.middlewares!.push($wrapperFn);

            // _routes.push(route);

            if (!(route.method in _routes)) {
                _routes[route.method] = []
            }

            _routes[route.method].push(route);

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
        success
    }
}