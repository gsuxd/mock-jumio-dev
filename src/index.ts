import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database';
import routes from './routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Jumio Mock Server - Identity Verification API',
    version: '1.0.0',
    documentation: 'https://documentation.jumio.ai',
    endpoints: {
      oauth2: '/oauth2/token',
      accounts: '/api/v1/accounts',
      retrieval: '/api/v1/accounts/:accountId/workflow-executions/:workflowExecutionId',
      webInterface: '/workflow/:workflowExecutionId',
      health: '/health'
    },
    mockInfo: {
      emailPatterns: {
        'approved@* or success@*': 'APPROVED_VERIFIED',
        'rejected@* or failed@*': 'REJECTED_UNSUPPORTED_ID_TYPE',
        'review@* or manual@*': 'REQUIRES_MANUAL_REVIEW',
        'other': 'APPROVED_VERIFIED (default)'
      }
    }
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/', routes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');

    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('🚀 Jumio Mock Server Started');
      console.log('='.repeat(60));
      console.log(`Port: ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Base URL: http://localhost:${PORT}`);
      console.log('');
      console.log('📋 Available Endpoints:');
      console.log(`  OAuth2: POST http://localhost:${PORT}/oauth2/token`);
      console.log(`  Accounts: POST http://localhost:${PORT}/api/v1/accounts`);
      console.log(`  Retrieval: GET http://localhost:${PORT}/api/v1/accounts/{id}/workflow-executions/{id}`);
      console.log(`  Web UI: GET http://localhost:${PORT}/workflow/{id}`);
      console.log('');
      console.log('🧪 Mock Email Patterns:');
      console.log('  approved@test.com → APPROVED');
      console.log('  rejected@test.com → REJECTED');
      console.log('  review@test.com → MANUAL_REVIEW');
      console.log('='.repeat(60));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
