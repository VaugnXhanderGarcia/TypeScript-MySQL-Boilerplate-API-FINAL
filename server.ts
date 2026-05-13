import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors, { CorsOptions } from 'cors';
import swaggerUi from 'swagger-ui-express';

import errorHandler from './_middleware/error-handler';
import accountsController from './accounts/accounts.controller';
import { initialize } from './_helpers/db';
import { swaggerSpec } from './swagger';

const app = express();

app.disable('etag');

// Disable browser/API caching
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Allowed frontend/backend origins
const allowedOrigins = [
  'http://localhost:4200',
  'https://angular-auth-frontend-final-frontend.onrender.com',
  'https://angular-auth-final.onrender.com'
];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin, like Swagger, Postman, curl
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log('Blocked by CORS:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Angular Auth API is running',
    docs: '/api-docs'
  });
});

// API routes
app.use('/accounts', accountsController);

// Global error handler
app.use(errorHandler);

const port = process.env.PORT || 4000;

initialize()
  .then(() => {
    app.listen(port, () => {
      console.log('Server listening on port ' + port);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:');
    console.error(err);
    process.exit(1);
  });