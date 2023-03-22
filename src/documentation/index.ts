/* eslint-disable */
import fs from "fs";
import path from "path";
import URL from "url";

type DocParams = {
  title: string;
  filePaths: string;
  version?: string;
  urls?: string[];
};
export default class _Documentation {
  public filePaths: string;
  public masterTemplate: Record<string, any>;
  public endpoints: Record<string, any>[] = [];

  constructor({ title, filePaths, version, urls }: DocParams) {
    this.filePaths = filePaths || this.filePaths;
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

  getSchema(variable: any): any {
    if (variable == null) {
      return {};
    }

    switch (typeof variable) {
      case "string":
        return { type: "string" };
      case "number":
        return { type: "number" };
      case "boolean":
        return { type: "boolean" };
      case "object":
        if (Array.isArray(variable)) {
          return {
            type: "array",
            items: this.getSchema(variable[0]),
          };
        }
        const schema: { type: string; properties: Record<string, any> } = {
          type: "object",
          properties: {},
        };
        for (const [key, value] of Object.entries(variable)) {
          schema.properties[key] = this.getSchema(value);
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
      schema: this.getSchema("string"),
      required: true,
    }));
  }

  getQueryParameters(path: string) {
    const { URLSearchParams } = URL;
    const queryParams = new URLSearchParams(path.split("?")[1]);
    return Array.from(queryParams.entries()).map(([key, value]) => ({
      in: "query",
      name: key,
      schema: this.getSchema(value),
    }));
  }

  getHeaderParameters(headers: Record<string, any>) {
    return Object.keys(headers)
      .filter(
        (key: any) =>
          !["User-Agent", "Content-Type", "Authorization"].includes(key)
      )
      .map((header) => ({
        in: "header",
        name: header,
        schema: this.getSchema(headers[header]),
      }));
  }

  getPath(req: any, res: any, options: any = {}) {
    return {
      [req.method]: {
        description: options.description || "",
        tags: options.tags || [],
        parameters: [
          ...this.getHeaderParameters(req.headers),
          ...this.getPathParameters(options),
          ...this.getQueryParameters(req.path),
        ],
        ...(req.method.toLowerCase() === "get"
          ? {}
          : this.resolveRequestBody(req)),
        responses: this.resolveResponse(res),
      },
    };
  }

  resolveRequestBody(req: any = {}) {
    return req.body && Object.values(req.body).length
      ? {
          requestBody: {
            content: {
              "application/json": {
                schema: this.getSchema(req.body),
                example: req.body,
              },
            },
          },
        }
      : {};
  }
  resolveResponse(res: any) {
    return {
      [res.status]: {
        description: "",
        content: {
          "application/json": {
            schema: this.getSchema(res.body),
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

  transformPath = (path: string, options: any): string => {
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
              this.resolveRequestBody(request).requestBody || {};
          }
          template.paths[path][request.method].responses = {
            ...(template.paths[path][request.method].responses || {}),
            ...this.resolveResponse(response),
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

    fs.writeFileSync(
      this.filePaths,
      JSON.stringify(template, undefined, 2),
      "utf8"
    );
    return template;
  }
}
