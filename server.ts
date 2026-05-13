import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import errorHandler from './_middleware/error-handler';
import accountsController from './accounts/accounts.controller';
import { initialize } from './_helpers/db';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

const app = express();

app.disable('etag');

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());



const allowedOrigins = [
  'http://localhost:4200',
  'https://angular-auth-frontend-final-frontend.onrender.com',
  'https://angular-auth-final.onrender.com'
];

app.use(cors({
  origin: (origin, callback) => {
    // allow Swagger, Postman, server-to-server, and same-origin requests
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.options(/.*/, cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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