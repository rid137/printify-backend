import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import { isSwaggerEnabled } from "../config/secrets.js";

const errorExample = (
  message: string,
  code: string,
  statusCode: number,
  details?: { path: string; message: string }[]
) => ({
  error: {
    message,
    code,
    statusCode,
    ...(details ? { details } : {}),
  },
});

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Printing App API",
      version: "1.0.0",
      description:
        "API documentation for Printing App Backend. Paths are rooted at the host (include /api). Authentication: register does not issue a JWT; POST /api/auth/verify-otp does. Unverified login returns 403.",
    },
    servers: [
      {
        url: "http://localhost:8080",
        description: "Development server (default PORT)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                message: { type: "string", example: "Validation failed" },
                code: { type: "string", example: "ERR_VALID" },
                statusCode: { type: "integer", example: 400 },
                details: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      path: { type: "string", example: "email" },
                      message: {
                        type: "string",
                        example: "Invalid email address",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: errorExample("Invalid email address", "ERR_VALID", 400, [
                { path: "email", message: "Invalid email address" },
              ]),
            },
          },
        },
        Unauthorized: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: errorExample("Not authorized, no token.", "ERR_AUTH", 401),
            },
          },
        },
        Forbidden: {
          description: "Forbidden",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: errorExample(
                "Email verification required",
                "ERR_FORBIDDEN",
                403
              ),
            },
          },
        },
        NotFound: {
          description: "Not Found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: errorExample("Order not found", "ERR_NF", 404),
            },
          },
        },
        Conflict: {
          description: "Conflict",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: errorExample(
                "Order status was updated by another request. Please retry.",
                "ERR_CONFLICT",
                409
              ),
            },
          },
        },
        UnprocessableEntity: {
          description: "Unprocessable Entity",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: errorExample(
                "Invalid input format.",
                "ERR_UNPROCESSABLE",
                422
              ),
            },
          },
        },
        TooManyRequests: {
          description: "Too Many Requests",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: errorExample(
                "Too many requests, please try again later.",
                "ERR_RATE_LIMIT",
                429
              ),
            },
          },
        },
        InternalServerError: {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: errorExample(
                "An unexpected error occurred",
                "ERR_INTERNAL",
                500
              ),
            },
          },
        },
      },
    },
  },
  apis: ["./src/docs/**/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app: Express, port: number) {
  if (!isSwaggerEnabled()) {
    return;
  }

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get("/docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log(`Docs available at http://localhost:${port}/docs`);
}

export default swaggerDocs;
