import { _validateConfig, _createConfig } from "./core/ConfigValidator";
import { _paginateResponse, _APIResponse } from "./core/ApiResponse";

export const validateConfig = _validateConfig;
export const createConfig = _createConfig;
export const paginate = _paginateResponse;
export const APIResponse = _APIResponse;

export { default as Config } from "./core/ConfigValidator";
export { default as RegisterController } from "./core/RegisterControllers";
export { default as generators } from "./core/Generators";
export { default as Documentation } from "./core/Documentation";
export { default as APIError } from "./core/ApiError";
export { default as useDecorator } from "./core/UseDecorators";
export { default as useHttpDecorator } from "./core/UseHTTPDecorators";
export { default as Logger } from "./core/Logger";
export { default as Router } from "./core/Router";
export { default as App } from "./core/App";
