import { Request, Response } from 'express';
import db from '../config/database';
import { generateAccountId, generateWorkflowExecutionId } from '../utils/idGenerator';
import { generateSDKToken, generateAPIToken } from '../utils/jwt';
import { generateAccountResponse } from '../services/mockDataService';

export class AccountController {
  // POST /api/v1/accounts - Create new account
  static async createAccount(req: Request, res: Response): Promise<void> {
    try {
      const {
        customerInternalReference,
        userReference,
        workflowDefinition,
        callbackUrl,
        successUrl,
        errorUrl
      } = req.body;

      if (!workflowDefinition || !workflowDefinition.key) {
        res.status(400).json({
          error: 'invalid_request',
          message: 'workflowDefinition.key is required'
        });
        return;
      }

      const accountId = generateAccountId();
      const workflowExecutionId = generateWorkflowExecutionId();

      // Store account in database
      await new Promise<void>((resolve, reject) => {
        db.run(
          `INSERT INTO accounts (id, customer_internal_reference, user_reference, workflow_definition_key, callback_url, success_url, error_url)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [accountId, customerInternalReference, userReference, workflowDefinition.key, callbackUrl, successUrl, errorUrl],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // Store workflow execution
      await new Promise<void>((resolve, reject) => {
        db.run(
          `INSERT INTO workflow_executions (id, account_id, status, user_reference)
           VALUES (?, ?, ?, ?)`,
          [workflowExecutionId, accountId, 'PENDING', userReference],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // Generate tokens
      const sdkToken = generateSDKToken(accountId, workflowExecutionId);
      const apiToken = generateAPIToken(workflowExecutionId);

      // Generate response
      const response = generateAccountResponse(
        accountId,
        workflowExecutionId,
        sdkToken,
        apiToken,
        customerInternalReference,
        successUrl,
        errorUrl
      );

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating account:', error);
      res.status(500).json({
        error: 'server_error',
        message: 'Failed to create account',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PUT /api/v1/accounts/:accountId - Update existing account
  static async updateAccount(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const {
        customerInternalReference,
        userReference,
        workflowDefinition,
        callbackUrl,
        successUrl,
        errorUrl
      } = req.body;

      // Check if account exists
      const account = await new Promise<any>((resolve, reject) => {
        db.get('SELECT * FROM accounts WHERE id = ?', [accountId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!account) {
        res.status(404).json({
          error: 'not_found',
          message: 'Account not found'
        });
        return;
      }

      const workflowExecutionId = generateWorkflowExecutionId();

      // Update account
      if (workflowDefinition) {
        await new Promise<void>((resolve, reject) => {
          db.run(
            `UPDATE accounts SET workflow_definition_key = ?, callback_url = ?, success_url = ?, error_url = ?
             WHERE id = ?`,
            [workflowDefinition.key, callbackUrl, successUrl, errorUrl, accountId],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      // Create new workflow execution
      await new Promise<void>((resolve, reject) => {
        db.run(
          `INSERT INTO workflow_executions (id, account_id, status, user_reference)
           VALUES (?, ?, ?, ?)`,
          [workflowExecutionId, accountId, 'PENDING', userReference],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // Generate tokens
      const sdkToken = generateSDKToken(accountId, workflowExecutionId);
      const apiToken = generateAPIToken(workflowExecutionId);

      // Generate response
      const response = generateAccountResponse(
        accountId,
        workflowExecutionId,
        sdkToken,
        apiToken,
        customerInternalReference,
        successUrl,
        errorUrl
      );

      res.json(response);
    } catch (error) {
      console.error('Error updating account:', error);
      res.status(500).json({
        error: 'server_error',
        message: 'Failed to update account',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
