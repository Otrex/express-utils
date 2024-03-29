/* eslint-disable */
import fs, { ReadStream } from "fs";
import path from "path";
import URL from "url";

type DocParams = {
  title: string;
  filePaths: string;
  version?: string;
  urls?: string[];
};

export type AddEndpointOption = {
  request: {
    body: any;
    headers: any;
  },
  tags?: any[];
  summary?: string;
  description?: string;
  [key: string]: any;
}

export class _$Ref {
  constructor(public _path: string) {}
  static use(component: string) {
    return new _$Ref(component);
  }
  get path() {
    return `#/components/schemas/${this._path}`
  }
}

export default class _Documentation {
  public filePaths: string;
  public masterTemplate: Record<string, any>;
  public components: Record<string, any>;
  public endpoints: Record<string, any>[] = [];

  constructor({ title, filePaths, version, urls }: DocParams) {
    this.filePaths = filePaths || this.filePaths;
    this.components = {
      schemas: {}
    };

    this.masterTemplate = {
      openapi: "3.0.0",
      info: {
        title,
        version: version || "1.0.0",
      },
      servers: [...(urls || ["http://localhost:4000"]).map((url) => ({ url }))],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
      paths: {},
    };
  }

  getSchema(variable: any, options: any): any {
    if (variable == null) {
      return {};
    }

    if (variable instanceof _$Ref) {
      return {
        $ref: variable.path
      }
    }

    if (variable instanceof ReadStream) {
      return { 
        type: 'string',
        format: 'binary'      
      }
    }

    switch (typeof variable) {
      case "string":
        if (options && options.enums && options.enums[variable]) {
          return {
            type: "string",
            enum: options.enums[variable]
          }
        }
        return { type: "string" };
      case "number":
        return { type: "number" };
      case "boolean":
        return { type: "boolean" };
      case "object":
        if (Array.isArray(variable)) {
          return {
            type: "array",
            items: this.getSchema(variable[0], options),
          };
        }
        const schema: { type: string; properties: Record<string, any> } = {
          type: "object",
          properties: {},
        };
        for (const [key, value] of Object.entries(variable)) {
          schema.properties[key] = this.getSchema(value, options);
        }
        return schema;
      default:
        return {};
    }
  }

  getPathParameters(options: Record<string, any>) {
    const params = options.pathParameters || [];
    return params.map((param: any) => ({
      in: "path",
      name: param.name,
      description: param.description || "",
      schema: this.getSchema("string", options),
      required: true,
    }));
  }

  getQueryParameters(path: string, options: any) {
    const { URLSearchParams } = URL;
    const queryParams = new URLSearchParams(path.split("?")[1]);
    return Array.from(queryParams.entries()).map(([key, value]) => ({
      in: "query",
      name: key,
      schema: this.getSchema(value, options),
    }));
  }

  getHeaderParameters(headers: Record<string, any>, options: any) {
    return Object.keys(headers)
      .filter(
        (key: any) =>
          !["User-Agent", "Content-Type", "Authorization"].includes(key)
      )
      .map((header) => ({
        in: "header",
        name: header,
        schema: this.getSchema(headers[header], options),
      }));
  }

  getPath(req: any, res: any, options: any = {}) {
    return {
      [req.method]: {
        summary: options.summary || "",
        description: options.description || "",
        tags: options.tags || [],
        parameters: [
          ...this.getHeaderParameters(req.headers, options),
          ...this.getPathParameters(options),
          ...this.getQueryParameters(req.path, options),
        ],
        ...(req.method.toLowerCase() === "get"
          ? {}
          : this.resolveRequestBody(req, options)),
        responses: this.resolveResponse(res, options),
      },
    };
  }

  resolveRequestBody(req: any = {}, options: any = {}) {
    if (options.request && options.request.body) {
      return Object.values(options.request.body).length
        ? {
            requestBody: {
              content: {
                [options.request.headers['content-type'] || options.request.headers['Content-Type']]: {
                  schema: this.getSchema(options.request.body, options),
                  example: options.request.body,
                },
              },
            },
          }
        : {};
    }

    return req.body && Object.values(req.body).length
      ? {
          requestBody: {
            content: {
              "application/json": {
                schema: this.getSchema(req.body, options),
                example: req.body,
              },
            },
          },
        }
      : {};
  }
  resolveResponse(res: any, options: any) {
    return {
      [res.status]: {
        description: "",
        content: {
          "application/json": {
            schema: this.getSchema(res.body, options),
            example: res.body,
          },
        },
      },
    };
  }

  addEndpoint = (res: any, options: any = {}) => {
    const request = {
      method: res.request.method.toLowerCase(),
      path: res.res.req.path,
      headers: res.request.header,
      body: res.request._data || null,
    };
    const response = {
      status: res.status,
      body: res.body,
    };

    this.endpoints.push({
      request,
      response,
      options,
    });
  };

  transformPath = (path: string, options: AddEndpointOption): string => {
    if (options.pathParameters) {
      const pathArray = path
        .split("/")
        .slice(1)
        .map((segment, index) => {
          const param = options.pathParameters.find(
            (p: any) => p.index === index
          );
          if (param) {
            return `{${param.name}}`;
          }
          return segment;
        });
      return `/${pathArray.join("/")}`;
    }
    return path.split("?").shift() as string;
  };

  addComponent(name: string, schema: any) {
    this.components.schemas[name] = this.getSchema(schema, {});
  }

  renderDocumentation() {
    const template = { ...this.masterTemplate };
    // this.retrieveEndpoints();
    for (const endpoint of this.endpoints) {
      const { request, response, options } = endpoint;
      const path = (<string>(
        this.transformPath(request.path, options).split("?").shift()
      )) as string;
      if (template.paths[path]) {
        if (template.paths[path][request.method]) {
          if (response.status === 200) {
            template.paths[path][request.method].requestBody = //
              this.resolveRequestBody(request, options).requestBody || {};
          }
          template.paths[path][request.method].responses = {
            ...(template.paths[path][request.method].responses || {}),
            ...this.resolveResponse(response, options),
          };
        } else {
          template.paths[path][request.method] = {
            ...(template.paths[path][request.method] || {}),
            ...this.getPath(request, response, options)[request.method],
          };
        }
      } else {
        template.paths[path] = {
          ...(template.paths[path] || {}),
          ...this.getPath(request, response, options),
        };
      }
    }

    template.components = this.components;

    fs.writeFileSync(
      this.filePaths,
      JSON.stringify(template, undefined, 2),
      "utf8"
    );
    return template;
  }
}
