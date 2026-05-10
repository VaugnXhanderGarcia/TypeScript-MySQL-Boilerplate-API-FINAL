import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Angular Auth Node MySQL API',
            version: '1.0.0',
            description: 'Authentication API with JWT, refresh tokens, email verification, forgot password, reset password, roles, and account management.'
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:4000',
                description: 'API Server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: ['./accounts/*.ts', './server.ts']
});