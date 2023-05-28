import express, { NextFunction, Request, Response, Router } from "express";
import { APIError, createLogger, useHttpDecorator } from "../pkg";

import { Context, IAfterEach } from "../pkg/types";
import createServer from "../pkg/core/Server";
import Server from "../pkg/core/Server";
import mount from "../pkg/core/LoadController";

const { Controller, AfterEach, BaseController, ...D } = useHttpDecorator();
const logger = createLogger({
  scope: __filename,
  logDebug: false,
});

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

const after: IAfterEach = ({ name }) => {
  console.log(name);
};

class TextService {
  getNumbers() {
    return [1, 3, 5];
  }
}

@AfterEach(after)
@Controller()
class TextController extends BaseController(Router) {
  t: string = " pink";
  service: TextService;

  constructor() {
    super();
    this.service = new TextService();
  }

  @D.Middlewares([M1])
  @D.Get()
  ben(@D.Pipe(pipe) @D.Query() body: any, ctx: Context) {
    // throw new APIError("Not implemented", 400);
    return { result: this.t, body };
  }

  @D.Middlewares([M1])
  @D.Post("/:id")
  index(
    @D.Pipe(pipe) @D.Body() body: any,
    @D.Pipe(pipe) @D.Pipe((d: any) => parseInt(d)) @D.Params("id") id: number,
    ctx: Context
  ) {
    // throw new APIError("Not implemented", 400);

    // console.log(ctx);

    return ctx.response
      .status(201)
      .send({ result: this.t, body, id, numbers: this.service.getNumbers() });
  }
}

const app = express();

app.use(M1);
app.use(express.json());
app.use("/", mount([TextController]));
app.use(GeneralMiddleware.ErrorHandler);

Server.start({
  force: true,
  expressApp: app,
  onStart: ({ port }) => {
    logger.color("red").log(`xxPort Started on ${port}`);
    logger.info(`Port Started on ${port}`);
  },
});
