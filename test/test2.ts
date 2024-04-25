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
  (req as any).session = {
    "user": {}
  }
  next();
};

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



@Controller()
class TextController extends BaseController {
  service: TextService;
  __setup() {
    this.__use(M1)
    this.__basePath = "/services";
    this.service = new TextService()
  }



  @D.Middlewares([M1])
  @D.Get()
  ben(@D.Pipe(pipe) @D.Query() body: any, @D.ReqExtract('session.user') session: any) {
    // throw new APIError("Not implemented", 400);
    // return { result: this.t, body };
    this.respondWith({ body, session }, 400)
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
      .send({ body, id, numbers: this.service.getNumbers() });
  }
}

const app = express();

app.use(M1);
app.use(express.json());
app.use("/", mount([TextController]));


Server.start({
  force: true,
  expressApp: app,
  onStart: ({ port }) => {
    logger.color("red").log(`xxPort Started on ${port}`);
    logger.info(`Port Started on ${port}`);
  },
});


class ManGoAPI extends Server {
  app = express();
  register() {
    this.app.use()
  }

  async beforeStart() {

  }

  onStart() {
    // Register
  }
}
