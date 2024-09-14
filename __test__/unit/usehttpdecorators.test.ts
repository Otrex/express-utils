
import UseHTTPDecorators from '../../pkg/core/UseHTTPDecorators';
import { Request, Response, NextFunction } from 'express';

describe('UseHTTPDecorators', () => {
  const { Http, P, BaseController, Controller, AfterEach, RegisterRoutes } = UseHTTPDecorators();

  describe('Controller Decorator', () => {
    it('should create a controller with decorators', () => {
      @Controller()
      class TestController extends BaseController {
        @Http.Get('/test')
        testMethod() {
          return 'Test successful';
        }
      }

      const instance = new TestController();
      expect(instance).toBeInstanceOf(BaseController);
      expect(instance.router).toBeDefined();
    });
  });

  describe('HTTP Method Decorators', () => {
    it('should add routes to the controller', () => {
      @Controller()
      class TestController extends BaseController {
        @Http.Get('/get')
        getMethod() { }

        @Http.Post('/post')
        postMethod() { }

        @Http.Put('/put')
        putMethod() { }

        @Http.Patch('/patch')
        patchMethod() { }

        @Http.Delete('/delete')
        deleteMethod() { }
      }

      const instance = new TestController();
      const routes = instance.router.stack.map((layer: any) => ({
        method: layer.route.stack[0].method,
        path: layer.route.path,
      }));

      expect(routes).toContainEqual({ method: 'get', path: '/get' });
      expect(routes).toContainEqual({ method: 'post', path: '/post' });
      expect(routes).toContainEqual({ method: 'put', path: '/put' });
      expect(routes).toContainEqual({ method: 'patch', path: '/patch' });
      expect(routes).toContainEqual({ method: 'delete', path: '/delete' });
    });
  });

  describe('Parameter Decorators', () => {
    it('should inject request parameters', async () => {
      @Controller()
      class TestController extends BaseController {
        @Http.Get('/params/:id')
        testMethod(@P.Params('id') id: string, @P.Query('q') query: string, @P.Body('data') body: any) {
          return { id, query, body };
        }
      }

      const instance = new TestController();
      const router = RegisterRoutes();

      const req = {
        params: { id: '123' },
        query: { q: 'test' },
        body: { data: 'example' },
      } as unknown as Request;
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;
      const next = jest.fn() as NextFunction;

      await router.stack[0].handle(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: '123', query: 'test', body: 'example' },
      });
    });
  });

  describe('Middleware Decorator', () => {
    it('should apply middleware to routes', () => {
      const testMiddleware = jest.fn((req: Request, res: Response, next: NextFunction) => next());

      @Controller()
      class TestController extends BaseController {
        @Http.Get('/middleware-test')
        @Http.Middlewares(testMiddleware)
        testMethod() {
          return 'Middleware test';
        }
      }

      const instance = new TestController();
      const middlewares = instance.router.stack[0].route.stack;

      expect(middlewares).toHaveLength(2); // One for the middleware, one for the route handler
      expect(middlewares[0].handle).toBe(testMiddleware);
    });
  });

  describe('AfterEach Decorator', () => {
    it('should call AfterEach handler after route execution', async () => {
      const afterEachHandler = jest.fn();

      @Controller()
      @AfterEach(afterEachHandler)
      class TestController extends BaseController {
        @Http.Get('/after-each-test')
        testMethod() {
          return 'AfterEach test';
        }
      }

      const instance = new TestController();
      const router = RegisterRoutes();

      const req = {} as Request;
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;
      const next = jest.fn() as NextFunction;

      await router.stack[0].handle(req, res, next);

      expect(afterEachHandler).toHaveBeenCalledWith({
        name: 'testMethod',
        method: 'get',
        controller: 'TestController',
        response: 'AfterEach test',
      });
    });
  });
});
