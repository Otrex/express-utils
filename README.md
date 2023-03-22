## Express Utils

This is an express based utility library that provides utility decorators that can be used together with express typescript.

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
      "data": {
        test: "red",
        "jesus": [
          "red", "green", "blue"
        ]
      }
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