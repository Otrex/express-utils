import { Router } from "express";

interface IController {
  new (...args: any[]): any;
  $register: () => Router;
}

function singleController<T extends IController>(controller: T) {
  const $controller = controller;

  if ("registerRoutes" in $controller) {
    return ($controller as any).registerRoutes();
  }

  if ("$register" in $controller) {
    return controller.$register();
  }
}

export default function <T extends IController>(controllers: T[] | T): Router {
  if (Array.isArray(controllers)) {
    const $routerGroup = Router();
    controllers.forEach((ctr) => {
      const $router = Router();
      $router.use(singleController(ctr));
      $routerGroup.use('/', $router);
    });
    return $routerGroup;
  }
  return singleController(controllers);
}
