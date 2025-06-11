import CustomError from "./customError.js";

export const BadRequest = (message = "Bad request") =>
    new CustomError({ message, statusCode: 400, code: "ERR_VALID" });

export const Unauthorized = (message = "Unauthorized") =>
    new CustomError({ message, statusCode: 401, code: "ERR_AUTH" });

export const Forbidden = (message = "Forbidden") =>
    new CustomError({ message, statusCode: 403, code: "ERR_FORBIDDEN" });

export const NotFound = (message = "Not found") =>
    new CustomError({ message, statusCode: 404, code: "ERR_NF" });

export const Conflict = (message = "Conflict") =>
    new CustomError({ message, statusCode: 409, code: "ERR_CONFLICT" });

export const UnprocessableEntity = (message = "Unprocessable entity") =>
    new CustomError({ message, statusCode: 422, code: "ERR_UNPROCESSABLE" });

export const InternalServerError = (message = "Internal server error") =>
    new CustomError({ message, statusCode: 500, code: "ERR_INTERNAL" });
