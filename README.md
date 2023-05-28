## Express Utils

This is an express based utility library that provides utility decorators that can be used together with express typescript.

### UseHTTPDecorator

The `useHTTPDecorator` function is an improvement over the `useDecorator`. It supports the `this` variable. The extended class constructor is instantiated within the `$register` static method that is shipped with the `useHTTPDecorator()`.

Routes can be easily setup using:

```javascript
import { useHttpDecorator } from "@obisiket1/express-utils";
import { Router } from "express";

const { BaseController, Http, P } = useHttpDecorator();

@Http.Controller()
export default class AuthCtrl extends BaseController(Router) {
  @Http.Get("/api")
  index(@P.Query() query: Record<string, any>) {
    return {
      data: query,
    };
  }
}
```

That sets up the controller with the route `/api`, which can then be registered to the express app setup using the `mount` function.

```javascript
import { mount } from "@obisiket1/express-utils";
import express from "express";

const app = express();

app.use("/", mount(AuthCtrl))

...

export default app
```

That also supports for multiple Controllers in the form.

```javascript
app.use("/v1", mount([
  Controller1,
  Controller2
  ...
  ControllerN
]))
```

### Server

You can also use our `Server` class to setup the server. The `Server` class provides the ability to add setup functions to the server. It also provides the graceful shutdown out of the box.

Check out the example below:

```javascript
import { Server } from "@obisiket1/express-utils";
import app from "./app";

Server.start({
  force: true,
  expressApp: app,
  onStart: ({ port }) => {
    console.log("Server has started @", port);
  },
});
```

### Logger

To set up a logger for a given application use:

```javascript
const logger = createLogger({
  scope: __filename,
  logDebug: false,
});
```

### CreateConfig

This is a helper function that not only helps to manage configuration but also provides a way to validate the configuration.
To use this function use the following:

```javascript
import { createConfig } from "@obisiket1/express-utils";

export default createConfig({
  config: {
    // configuration goes here
  },
});
```

### Mail
This is still experimental, it provides a way to handle mails on your server;
Here's an example:

```ts
class Sender implements ISender {
  send(mail: IMail): void {
    console.log("Sent!", mail);
  }
}

const { Mail } = useMailer({
  sender: new Sender(),
  templatePath: path.join(__dirname, "templates"),
});

Mail.create({
  template: "text",
  subject: "Hello",
  data: {
    name: "Treasure",
    first_name: "Obisike",
  }
}).send();
```

It basically makes your templates readily available using a lightweight template compiler. You can also build your template compiler and add it to the `useMailer` options.
```ts
const { Mail } = useMailer({
  ...,
  templateEngine: new TemplateEngine(),
  ...,
});
```

The `TemplateEngine` must implement the `ITemplateEngine` interface.

Here is the default option:
```ts
const defaultOptions = {
  templateEngine: new StringEngine(),
};
```

### UseDecorator

The `useDecorator` is a function that returns decorators that can be used to setup your routes

```javascript
import { Logger, useDecorator } from "@obisiket1/express-utils";
import { NextFunction, Request, Response, Router } from "express";

const { GlobalMiddleware, Success, Controller, Post } = useDecorator();

@GlobalMiddleware({ path: "/auth" })
export default class AuthController extends Controller(Router) {
  @Post()
  async register(req: Request, res: Response, next: NextFunction) {
    const result = {
      data: {
        test: "red",
        jesus: ["red", "green", "blue"],
      },
    };

    return Success(res, result);
  }
}
```

> Decorators Contained in the `useDecorator` include:

<table>
  <th> Decorator </th>
  <th> Description </th>
  <tr>
    <td> GlobalMiddleware </td>
    <td>
      The `GlobalMiddleware` as the name entails, sets up a global middleware accross routes on the class.
    </td>
  </tr>
  <tr>
    <td> Get </td>
    <td>
      The  `Get` decorator makes the function a get request handler. It takes `options` in the form:
      ```javascript
      {
        path: "/",
        middlewares: [...]
      }
      ```
      If the no option argument is provided, it will revert to the name of the method as the path.
    </td>
  </tr>
  <tr>
    <td> Post </td>
    <td>
      The  `Post` decorator makes the function a get request handler. It takes `options` in the form:
      ```javascript
      {
        path: "/",
        middlewares: [...]
      }
      ```
      If the no option argument is provided, it will revert to the name of the method as the path.
    </td>
  </tr>
</table>
