const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const isProd = process.env.NODE_ENV === 'production';
const serverUrl = isProd ? 'https://crm-pa87.onrender.com' : 'http://localhost:3000';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mini CRM API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Mini CRM platform',
      contact: {
        name: 'API Support',
        url: 'https://github.com/krishna-nishant/crm-backend'
      }
    },
    servers: [
      {
        url: serverUrl,
        description: isProd ? 'Production server' : 'Development server'
      }
    ],
    basePath: '/api',
    host: isProd ? 'crm-pa87.onrender.com' : 'localhost:3000',
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [path.join(__dirname, '../routes/*.js')],
};

// Add debug logging for Swagger configuration
console.log('Swagger Options:', {
  host: options.definition.host,
  basePath: options.definition.basePath,
  serverUrl: options.definition.servers[0].url,
  environment: process.env.NODE_ENV
});

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec; 