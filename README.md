# Mini CRM Backend 🔧

A scalable Node.js backend for the Mini CRM platform with advanced campaign management, customer data processing, and AI-powered features.

## 🏗️ Detailed Architecture

```mermaid
graph TD
    subgraph Client Layer
        FE[Frontend App] --> API[API Gateway]
        Webhook[Webhook] --> API
    end

    subgraph API Layer
        API --> Auth[Auth Service]
        API --> Valid[Validator]
        
        subgraph Core Services
            Campaign[Campaign Service]
            Customer[Customer Service]
            Analytics[Analytics Service]
        end
        
        Valid --> Core Services
    end

    subgraph Processing Layer
        Campaign --> Queue[Message Queue]
        Queue --> Consumer[Message Consumer]
        Consumer --> Batch[Batch Processor]
        
        subgraph AI Services
            NLP[Natural Language Processor]
        end
        
        Campaign --> AI Services
    end

    subgraph Data Layer
        Batch --> DB[(MongoDB)]
        Core Services --> DB
    end

    subgraph External Services
        AI Services --> OpenAI[OpenAI API]
        Consumer --> Vendor[Vendor API]
        Vendor --> DR[Delivery Receipt]
        DR --> Stats[Stats Processor]
    end
```

## ✨ Features

### 1. Data Management
- RESTful APIs for customer and order data
- Batch processing for optimal performance
- Data validation and sanitization

### 2. Campaign Processing
- Flexible audience segmentation engine
- Natural language rule processing
- Real-time campaign analytics
- Asynchronous message delivery
- Delivery status tracking and reporting

### 3. Authentication & Security
- Google OAuth 2.0 implementation
- JWT token management with refresh tokens
- Role-based access control
- Request validation
- CORS protection

### 4. AI Integration
- OpenAI API integration for natural language rule processing

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js
- **AI Integration**: OpenAI API

## 🚀 Detailed Setup Instructions

### Prerequisites

1. Database Setup
   ```bash
   # Install MongoDB (if not using cloud)
   # For Ubuntu
   sudo apt-get install mongodb
   sudo systemctl start mongodb
   
   # For macOS with Homebrew
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community
   ```

2. Node.js Setup
   ```bash
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Verify installation
   node --version
   npm --version
   ```

### Installation Steps

1. Clone and Setup:
   ```bash
   cd backend
   npm install
   ```

2. Environment Configuration:
   Create a `.env` file with the following:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/crm
   
   # Authentication
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   JWT_SECRET=your_jwt_secret_key
   JWT_REFRESH_SECRET=your_refresh_token_secret
   
   # URLs
   FRONTEND_URL=http://localhost:5173
   BACKEND_URL=http://localhost:3000
   
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key
   ```

3. Start the Server:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

### Environment Variables Guide

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| PORT | Server port | No | 3000 |
| MONGODB_URI | MongoDB connection URL | Yes | - |
| GOOGLE_CLIENT_ID | Google OAuth client ID | Yes | - |
| JWT_SECRET | JWT signing key | Yes | - |
| OPENAI_API_KEY | OpenAI API key | Yes | - |

## 📊 API Documentation

The API documentation is available through Swagger UI at `/api-docs` endpoint:
- Development: http://localhost:3000/api-docs
- Production: https://your-domain.com/api-docs

Swagger UI provides:
- Interactive API testing interface
- Request/response schemas
- Authentication documentation
- Real-time API testing
- Response examples

### Using Swagger UI

1. Authentication:
   - Click the "Authorize" button at the top
   - Enter your JWT token in the format: `Bearer <your-token>`
   - All subsequent requests will include this token

2. Testing Endpoints:
   - Endpoints are grouped by tags (Customers, Campaigns, Metrics)
   - Click on any endpoint to expand it
   - Click "Try it out" to test the endpoint
   - Fill in required parameters
   - Click "Execute" to make the request

3. Response Handling:
   - View response status codes
   - See response headers
   - Get formatted JSON responses
   - View response time metrics

### API Endpoints

#### Customer Endpoints
- `POST /api/customers` - Create a new customer
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get customer by ID
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

#### Campaign Endpoints
- `POST /api/campaigns` - Create a new campaign
- `GET /api/campaigns` - List all campaigns
- `GET /api/campaigns/:id` - Get campaign by ID
- `POST /api/campaigns/:id/start` - Start campaign delivery
- `GET /api/campaigns/:id/stats` - Get campaign statistics
- `POST /api/campaigns/natural-language` - Convert natural language to rules

#### Authentication Endpoints
- `GET /auth/google` - Initialize Google OAuth flow
- `GET /auth/google/callback` - OAuth callback handler
- `POST /auth/logout` - Logout user

## 🔍 Development Guidelines

### Code Structure
```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   ├── middleware/    # Custom middleware
│   ├── utils/         # Utility functions
│   └── server.js      # App entry point
```

### Error Handling
- Use custom error classes
- Implement global error handler
- Log errors appropriately
- Return consistent error responses

## 🚨 Troubleshooting

Common issues and solutions:

1. **Database Connection Issues**
   - Check MongoDB service status
   - Verify connection string
   - Check network connectivity
   - Ensure proper authentication

2. **Authentication Issues**
   - Verify Google OAuth setup
   - Check JWT configuration
   - Validate CORS settings
   - Check token expiration

3. **API Documentation Issues**
   - Ensure server is running
   - Check if `/api-docs` endpoint is accessible
   - Verify JWT token format in Swagger UI
   - Clear browser cache if UI is not loading

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Mongoose Documentation](https://mongoosejs.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)