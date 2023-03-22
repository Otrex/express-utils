// import { ApolloServer } from '@apollo/server';
// import { expressMiddleware } from '@apollo/server/express4';
// import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from "express";
// import http from 'http';
// import cors from 'cors';
// import { json } from 'body-parser';
// import types from './sdl/typeDefs/types';
// import App from './core/App';
// // import { typeDefs, resolvers } from './schema';

// const app = express();

// app.use((req, res, next) => {
//   console.log(`URL: ${req.url}`);
//   next();
// })

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// })

// App
//   .createServer(app)
//   .run({
//     forceStart: false,
//     setup: async () => {
//       await new Promise((resolve) => {
//         setTimeout(resolve, 1000)
//       })
//     }
//   })

// // const httpServer = http.createServer(app);
// // const server = new ApolloServer({
// //   typeDefs: [
// //     types
// //   ],
// //   // resolvers,
// //   plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
// // });

// // const t = async () => {
// // await server.start();
// // app.use(
// //   '/graphql',
// //   cors(),
// //   json(),
// //   expressMiddleware(server, {
// //     context: async ({ req }) => ({ token: req.headers.token }),
// //   }),
// // );

// // await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
// // console.log(`🚀 Server ready at http://localhost:4000/graphql`);
// // }

// // t();
// // console.log("Hello World!");

import App from "./core/App";

const server = App.plugin({ express });

server.partial((app) => {
  app.use((req, res, next) => {
    console.log(`URL: ${req.url}`);
    next();
  });

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });
});

server.beforeStart(async () => {});

server.run({
  forceStart: true,
  port: 3000,
});

import Router from "./core/Router";

const models = {
  i3: () => console.log("Hello"),
};

class Controller {
  models = null;
  constructor(models) {
    this.models = models;
  }
  hello(req, res) {
    res.send("hello world");
  }
}

// const controller = new Controller(models);

// const viewMiddleware = (req, res, next) => {
//   console.log("DATA::", req.url);
//   next();
// }

// const _router = Router.setHandler(express.Router, [viewMiddleware]);

// _router.group("/others", (router) => {
//   router.get("/", controller.hello);
// })

// _router.group("/", (router) => {
//   router.get("/login", controller.hello);
// })
