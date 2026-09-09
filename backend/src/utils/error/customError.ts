class CustomError<C extends string> extends Error {
  message: string;
  statusCode: number;
  code?: C;
  details?: unknown;

  constructor({
    message,
    statusCode,
    code,
    details,
  }: {
    message: string;
    statusCode: number;
    code?: C;
    details?: unknown;
  }) {
    super();
    this.message = message;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export default CustomError;
