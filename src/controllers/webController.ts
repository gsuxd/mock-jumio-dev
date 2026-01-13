import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import db from '../config/database';
import { getVerificationStatusFromEmail } from '../services/mockDataService';

export class WebController {
  // GET /workflow/:workflowExecutionId - Serve hosted interface
  static async serveWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { workflowExecutionId } = req.params;

      // Verify workflow exists
      const workflow = await new Promise<any>((resolve, reject) => {
        db.get(
          'SELECT * FROM workflow_executions WHERE id = ?',
          [workflowExecutionId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!workflow) {
        res.status(404).send('<h1>Workflow not found</h1>');
        return;
      }

      // Serve the HTML file
      const htmlPath = path.join(__dirname, '../views/workflow.html');
      res.sendFile(htmlPath);
    } catch (error) {
      console.error('Error serving workflow:', error);
      res.status(500).send('<h1>Error loading verification page</h1>');
    }
  }

  // POST /workflow/:workflowExecutionId/submit - Process workflow completion
  static async submitWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { workflowExecutionId } = req.params;
      const { uploads } = req.body;

      // Get workflow and account info
      const workflow = await new Promise<any>((resolve, reject) => {
        db.get(
          `SELECT we.*, a.user_reference, a.success_url, a.error_url, a.callback_url
           FROM workflow_executions we
           JOIN accounts a ON we.account_id = a.id
           WHERE we.id = ?`,
          [workflowExecutionId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!workflow) {
        res.status(404).json({
          status: 'error',
          message: 'Workflow not found'
        });
        return;
      }

      // Determine verification result based on email
      const verificationStatus = getVerificationStatusFromEmail(workflow.user_reference);
      const isApproved = verificationStatus === 'APPROVED_VERIFIED';

      // Update workflow status
      await new Promise<void>((resolve, reject) => {
        db.run(
          `UPDATE workflow_executions 
           SET status = ?, completed_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [verificationStatus, workflowExecutionId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // Simulate callback if URL is provided
      if (workflow.callback_url) {
        setTimeout(async () => {
          try {
            const callbackPayload = {
              timestamp: new Date().toISOString(),
              account: {
                id: workflow.account_id
              },
              workflowExecution: {
                id: workflowExecutionId,
                status: verificationStatus
              }
            };

            // In a real implementation, you would send an HTTP POST to callback_url
            console.log('Callback would be sent to:', workflow.callback_url);
            console.log('Callback payload:', JSON.stringify(callbackPayload, null, 2));
          } catch (error) {
            console.error('Error sending callback:', error);
          }
        }, parseInt(process.env.CALLBACK_DELAY_MS || '2000'));
      }

      // Return response with redirect URLs
      res.json({
        status: isApproved ? 'success' : 'error',
        verificationStatus: verificationStatus,
        successUrl: workflow.success_url || `${process.env.BASE_URL || 'http://localhost:3000'}/success`,
        errorUrl: workflow.error_url || `${process.env.BASE_URL || 'http://localhost:3000'}/error`
      });
    } catch (error) {
      console.error('Error submitting workflow:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to process workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /success - Success page
  static successPage(req: Request, res: Response): void {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Successful</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 60px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          .icon { font-size: 80px; margin-bottom: 20px; }
          h1 { color: #10b981; margin-bottom: 10px; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✅</div>
          <h1>Verification Successful!</h1>
          <p>Your identity has been verified successfully.</p>
        </div>
      </body>
      </html>
    `);
  }

  // GET /error - Error page
  static errorPage(req: Request, res: Response): void {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Failed</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 60px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          .icon { font-size: 80px; margin-bottom: 20px; }
          h1 { color: #ef4444; margin-bottom: 10px; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">❌</div>
          <h1>Verification Failed</h1>
          <p>We couldn't verify your identity. Please try again.</p>
        </div>
      </body>
      </html>
    `);
  }
}
