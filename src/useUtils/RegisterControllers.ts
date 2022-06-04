import { Router } from "express";

export default class _RegisterController {
  router: Router;
  static setup(routes: Router[]) {
    const controllers = new _RegisterController();
    controllers.registerAll(routes);
    return controllers.router;
  }
  constructor() {
    this.router = Router();
  }

  register(route: Router) {
    this.router.use(route)
  }

  registerAll(routes: Router[]) {
    routes.forEach(e => {
      this.router.use(e)
    })
  }
}