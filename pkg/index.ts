import {
  _validateConfig,
  _createConfig,
  _useConfig,
} from "./core/ConfigValidator";
import { _paginateResponse, _APIResponse } from "./core/ApiResponse";
import { _Logger } from "./core/Logger";
import { _$Ref } from "./core/Documentation";

export const validateConfig = _validateConfig;
export const createConfig = _createConfig;
export const paginate = _paginateResponse;
export const APIResponse = _APIResponse;
export const useConfig = _useConfig;
export const Logger = _Logger;
export const $Ref = _$Ref;

export { default as useMailer } from "./core/UseMailer";
export { default as RegisterController } from "./core/RegisterControllers";
export { default as useHttpDecorator } from "./core/UseHTTPDecorators";
export { default as Documentation } from "./core/Documentation";
export { default as useDecorator } from "./core/UseDecorators";
export { default as Config } from "./core/ConfigValidator";
export { default as generators } from "./core/Generators";
export { default as mount } from "./core/LoadController";
export { default as APIError } from "./core/ApiError";
export { default as createLogger } from "./core/Logger";
export { default as Router } from "./core/Router";
export { default as Server } from "./core/Server";
export { default as App } from "./core/App";
