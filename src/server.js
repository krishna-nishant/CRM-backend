require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const cron = require('node-cron');
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const campaignRoutes = require('./routes/campaigns');
const customerRoutes = require('./routes/customers');
const authRoutes = require('./routes/auth');
const metricsRoutes = require('./routes/metrics');

const app = express();

// Middleware
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// CORS configuration
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'https://crm-pa87.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Swagger UI setup
app.use('/api-docs', (req, res, next) => {
  swaggerSpec.host = req.get('host');
  swaggerSpec.schemes = [process.env.NODE_ENV === 'production' ? 'https' : req.protocol];
  req.swaggerDoc = swaggerSpec;
  next();
}, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    tryItOutEnabled: true,
    defaultModelsExpandDepth: 3,
    defaultModelExpandDepth: 3,
    defaultModelRendering: 'model',
    docExpansion: 'list',
    filter: true,
    withCredentials: true
  },
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Mini CRM API Documentation"
}));

// API Routes
app.get('/health', (req, res) => res.status(200).json({ status: 'healthy' }));
app.get('/', (req, res) => res.json({ message: 'Welcome to CRM API' }));
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/metrics', metricsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message;
  if (status === 500) console.error(err);
  res.status(status).json({ error: message });
});

// Connect to database
connectDB();

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Production health check cron job
if (process.env.NODE_ENV === 'production') {
  cron.schedule('*/14 * * * *', async () => {
    try {
      await axios.get(`${process.env.BACKEND_URL}/health`);
    } catch (error) {
      console.error('Health check failed:', error.message);
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
}); 