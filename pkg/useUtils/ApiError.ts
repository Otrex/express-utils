export default class _APIError extends Error {
  public statusCode: number;
  private errorType: string;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.errorType = "APIError";
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }

  getType() {
    return this.errorType;
  }
}
