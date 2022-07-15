import decorator from "./useDecorator";
import _Logger from "./useUtils/Logger";
import {
  _paginateResponse,
  _APIResponse 
} from "./useUtils/ApiResponse";
import _APIError from "./useUtils/ApiError";
import app from "./useApp";
import { _validateConfig, _createConfig } from "./useUtils/ConfigValidator";
import _RegisterController from "./useUtils/RegisterControllers";
import { generateHash, generateRandomCode } from "./useUtils/Generators";

export const generators = { generateRandomCode, generateHash }
export const RegisterController = _RegisterController;
export const validateConfig = _validateConfig;
export const createConfig = _createConfig
export const paginate = _paginateResponse;
export const APIResponse = _APIResponse;
export const useDecorator = decorator;
export const APIError = _APIError
export const Logger = _Logger;
export const useApp = app;