import { Request, Response } from "express";
import db from "../config/database";
import { generateMockVerificationResult } from "../services/mockDataService";

export class RetrievalController {
  // GET /api/v1/accounts/:accountId/workflow-executions/:workflowExecutionId
  static async getWorkflowResults(req: Request, res: Response): Promise<void> {
    try {
      const { accountId, workflowExecutionId } = req.params;

      // Get workflow execution from database
      const workflowExecution = await new Promise<any>((resolve, reject) => {
        db.get(
          `SELECT we.*, a.user_reference 
           FROM workflow_executions we
           JOIN accounts a ON we.account_id = a.id
           WHERE we.id = ? AND a.id = ?`,
          [workflowExecutionId, accountId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          },
        );
      });

      if (!workflowExecution) {
        res.status(404).json({
          error: "not_found",
          message: "Workflow execution not found",
        });
        return;
      }

      // Import the progressive result generator
      const { generateProgressiveWorkflowResult } =
        await import("../services/mockDataService");

      // Generate progressive result based on time elapsed
      const result = generateProgressiveWorkflowResult(
        workflowExecution.user_reference,
        accountId,
        workflowExecutionId,
        workflowExecution.created_at,
        workflowExecution.completed_at,
        workflowExecution.user_reference,
      );

      res.json(result);
    } catch (error) {
      console.error("Error retrieving workflow results:", error);
      res.status(500).json({
        error: "server_error",
        message: "Failed to retrieve workflow results",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // GET /api/v1/accounts/:accountId - Get account details
  static async getAccount(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;

      const account = await new Promise<any>((resolve, reject) => {
        db.get(
          "SELECT * FROM accounts WHERE id = ?",
          [accountId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          },
        );
      });

      if (!account) {
        res.status(404).json({
          error: "not_found",
          message: "Account not found",
        });
        return;
      }

      // Get workflow executions for this account
      const workflowExecutions = await new Promise<any[]>((resolve, reject) => {
        db.all(
          "SELECT * FROM workflow_executions WHERE account_id = ? ORDER BY created_at DESC",
          [accountId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          },
        );
      });

      res.json({
        id: account.id,
        customerInternalReference: account.customer_internal_reference,
        userReference: account.user_reference,
        workflowDefinitionKey: account.workflow_definition_key,
        createdAt: account.created_at,
        workflowExecutions: workflowExecutions.map((we) => ({
          id: we.id,
          status: we.status,
          createdAt: we.created_at,
          completedAt: we.completed_at,
        })),
      });
    } catch (error) {
      console.error("Error retrieving account:", error);
      res.status(500).json({
        error: "server_error",
        message: "Failed to retrieve account",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
