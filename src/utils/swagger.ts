import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Printing App API',
      version: '1.0.0',
      description: 'API documentation for Printing App Backend',
    },
    servers: [
      {
        url: 'http://localhost:9000/api',
        description: 'Development server',
      },
    ],
    // components: {
    //   securitySchemes: {
    //     bearerAuth: {
    //       type: 'http',
    //       scheme: 'bearer',
    //       bearerFormat: 'JWT',
    //     },
    //   },
    // },
    components: {
        securitySchemes: {
            bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            },
        },
        schemas: {
            ErrorResponse: {
                type: 'object',
                properties: {
                    success: {
                    type: 'boolean',
                    example: false,
                    },
                    message: {
                    type: 'string',
                    example: 'An error occurred',
                    },
                    error: {
                    type: 'object',
                    properties: {
                        code: {
                        type: 'string',
                        example: 'ERR_CODE',
                        },
                        statusCode: {
                        type: 'integer',
                        example: 400,
                        },
                    },
                },
            },
            },
        },
        responses: {
            BadRequest: {
            description: 'Bad Request',
            content: {
                'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                    success: false,
                    message: 'Please fill all the inputs.',
                    error: {
                    code: 'ERR_VALID',
                    statusCode: 400,
                    },
                },
                },
            },
        },
        Unauthorized: {
        description: 'Unauthorized',
        content: {
            'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
                success: false,
                message: 'Unauthorized access.',
                error: {
                code: 'ERR_AUTH',
                statusCode: 401,
                },
            },
            },
        },
        },
        Forbidden: {
        description: 'Forbidden',
        content: {
            'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
                success: false,
                message: 'Forbidden resource.',
                error: {
                code: 'ERR_FORBIDDEN',
                statusCode: 403,
                },
            },
            },
        },
        },
        NotFound: {
        description: 'Not Found',
        content: {
            'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
                success: false,
                message: 'Requested resource not found.',
                error: {
                code: 'ERR_NF',
                statusCode: 404,
                },
            },
            },
        },
        },
        Conflict: {
        description: 'Conflict',
        content: {
            'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
                success: false,
                message: 'User already exists.',
                error: {
                code: 'ERR_CONFLICT',
                statusCode: 409,
                },
            },
            },
        },
        },
        UnprocessableEntity: {
        description: 'Unprocessable Entity',
        content: {
            'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
                success: false,
                message: 'Invalid input format.',
                error: {
                code: 'ERR_UNPROCESSABLE',
                statusCode: 422,
                },
            },
            },
        },
        },
        InternalServerError: {
        description: 'Internal Server Error',
        content: {
            'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
                success: false,
                message: 'Something went wrong.',
                error: {
                code: 'ERR_INTERNAL',
                statusCode: 500,
                },
            },
            },
        },
        },
    },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/docs/**/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app: Express, port: number) {
  // Swagger page
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Docs in JSON format
  app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`Docs available at http://localhost:${port}/docs`);
}

export default swaggerDocs;