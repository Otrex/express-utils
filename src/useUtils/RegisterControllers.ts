import { Router } from "express";

export default class _RegisterController {
  Router: Router;
  static setup(routes: Router[]) {
    const controllers = new _RegisterController(routes);
    return controllers.Router;
  }
  static create(routes: Router[]) {
    return new _RegisterController(routes);
  }
  constructor(routes: Router[]) {
    this.Router = Router();
    this.registerAll(routes);
  }

  register(route: Router) {
    this.Router.use(route);
  }

  registerAll(routes: Router[]) {
    routes.forEach((e) => {
      this.Router.use(e);
    });
  }
}
