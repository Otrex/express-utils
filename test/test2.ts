import express, { NextFunction, Request, Response, Router } from "express";
import { APIError, App, RegisterController, useDecorator } from "../pkg";
import DecoratorV2 from "../pkg/core/UseHTTPDecorators";
import { Context } from "../pkg/types";

const { Controller, BaseController, ...D } = DecoratorV2();

const M1 = (req: Request, res: Response, next: NextFunction) => {
  console.log("Visiting", req.url);
  next();
};

export default class GeneralMiddleware {
  static ErrorHandler(
    err: Error | APIError,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (res.headersSent) return;

    if ("getType" in err) {
      return res.status(err.statusCode || 500).json({
        state: "error",
        type: err.name,
        message: err.message,
        timestamp: Date.now(),
        ...(true ? { stack: err.stack } : {}),
      });
    }

    return res.status(500).json({
      state: "error",
      type: "InternalServerError",
      timestamp: Date.now(),
      message: "Something went wrong | Contact us at support@servicer.io",
      ...(true ? { stack: err.stack } : {}),
    });
  }
}

const pipe = (data: Record<string, any>) => {
  return { data, ["key"]: "red" };
};

@Controller()
class TextController extends BaseController(Router) {
  t: string = " pink";

  @D.Middlewares([M1])
  @D.Get("/hello")
  index(@D.Pipe(pipe) @D.Query() body: any, ctx: Context) {
    // throw new APIError("Not implemented", 400);
    return { result: this.t, body };
  }
}

const app = express();
app.use(M1)

app.use("/", TextController.register())

app.use(GeneralMiddleware.ErrorHandler);
app.listen(4000, () => {
  console.log("Server started")
})
