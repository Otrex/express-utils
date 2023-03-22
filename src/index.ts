import decorator from "./useDecorator";
import _Logger from "./useUtils/Logger";
import { _paginateResponse, _APIResponse } from "./useUtils/ApiResponse";
import _APIError from "./useUtils/ApiError";
import app from "./useApp";
import { _validateConfig, _createConfig } from "./useUtils/ConfigValidator";
import _RegisterController from "./useUtils/RegisterControllers";
import { generateHash, generateRandomCode } from "./useUtils/Generators";
import _Documentation from "./documentation";
import _App from "./core/App";
import _Router from "./core/Router";

export const generators = { generateRandomCode, generateHash };
export const RegisterController = _RegisterController;
export const validateConfig = _validateConfig;
export const Documentation = _Documentation;
export const createConfig = _createConfig;
export const paginate = _paginateResponse;
export const APIResponse = _APIResponse;
export const useDecorator = decorator;
export const APIError = _APIError;
export const Router = _Router;
export const Logger = _Logger;
export const useApp = app;
export const App = _App;
