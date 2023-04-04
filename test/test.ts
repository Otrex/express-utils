// import { useDecorator } from './../src/index';
// import express from 'express';
// // Async Handler no =t yet working
// const app = express();

// const { Controller, globalMiddleware, asyncHandler } = useDecorator();

// @globalMiddleware('/ok')
// class BaseController extends Controller {
//   @BaseController.addRoute({ method: 'get', path: '/omit', useAsyncHandler: true, validator: (req: any) => { } })
//   async hello (req: any, res: any, next: any) {
//     console.log(req);
//     res.send('Ok')
//   }

//   @BaseController.addRoute({ method: 'get' })
//   helloMe(req: any, res: any, next: any) {
//     res.send('OkMe')
//   }
// }

// app.get('/kk', asyncHandler((req: any, res: any, next: any) => {
//   throw new Error('hello Error')
// }))

// app.use((err: any, req: any, res: any, next:any) => {
//   res.send(err.message);
// })
// app.use(BaseController.registerRoutes(express.Router()))

// app.listen(8011, () => console.log("Working"))

// import { Config } from "../pkg";

// Config.createConfig({})