import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AccountController } from '../controllers/accountController';
import { RetrievalController } from '../controllers/retrievalController';
import { WebController } from '../controllers/webController';
import { basicAuth, bearerAuth } from '../middleware/auth';

const router = Router();

// OAuth2 routes
router.post('/oauth2/token', basicAuth, AuthController.getToken);

// Account routes (require bearer token)
router.post('/api/v1/accounts', bearerAuth, AccountController.createAccount);
router.put('/api/v1/accounts/:accountId', bearerAuth, AccountController.updateAccount);

// Retrieval routes (require bearer token)
router.get('/api/v1/accounts/:accountId/workflow-executions/:workflowExecutionId', bearerAuth, RetrievalController.getWorkflowResults);
router.get('/api/v1/accounts/:accountId', bearerAuth, RetrievalController.getAccount);

// Web interface routes (no auth required - public facing)
router.get('/workflow/:workflowExecutionId', WebController.serveWorkflow);
router.post('/workflow/:workflowExecutionId/submit', WebController.submitWorkflow);
router.get('/success', WebController.successPage);
router.get('/error', WebController.errorPage);

export default router;
