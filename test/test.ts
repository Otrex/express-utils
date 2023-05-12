import express, { NextFunction, Request, Response, Router } from "express";
import { App, RegisterController, useDecorator } from "../pkg";

const { Controller, Get, RegisterRoutes, GlobalMiddleware } = useDecorator();

GlobalMiddleware({
  path: "/",
});
class BaseController {
  t: string = " red";
  constructor() {
    this.t = "Green";
  }
  @Get()
  index(_: any, res: Response) {
    return res.send("Hello World" + this.t);
  }
}

// TODO; handle when express is passed without the calling
// The App is buggy, shutdown is not working properly
const app = App.createServer<Express.Application>(express());
app.pluginConfig({
  use: [
    (req: Request, res: Response, next: NextFunction) => {
      console.log("Visiting", req.url);
      next();
    },
    ["/", RegisterRoutes(Router())],
  ],
});

app.run({
  port: 4000,
  shutdown: (ser) => {
    return () => process.exit(0);
  },
});
