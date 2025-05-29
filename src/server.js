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

// CORS configuration
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'https://crm-pa87.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Swagger UI setup - no authentication required
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    tryItOutEnabled: true,
    defaultModelsExpandDepth: 3,
    defaultModelExpandDepth: 3,
    defaultModelRendering: 'model',
    docExpansion: 'list',
    showCommonExtensions: true,
    showExtensions: true
  },
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Mini CRM API Documentation",
  customfavIcon: '/favicon.ico'
}));

// Initialize Passport and MongoDB
app.use(passport.initialize());
connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CRM API' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/metrics', metricsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An error occurred'
    : err.message || 'Something broke!';

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({ error: message });
});

const PORT = process.env.PORT || 3000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Setup cron job to keep server active
if (process.env.NODE_ENV === 'production') {
  // Schedule health check every 14 minutes
  cron.schedule('*/14 * * * *', async () => {
    try {
      const healthCheck = await axios.get(`${process.env.BACKEND_URL}/health`);
      console.log('Health check passed:', healthCheck.data.timestamp);
    } catch (error) {
      console.error('Health check failed:', error.message);
    }
  });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
}); 