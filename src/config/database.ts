import sqlite3 from "sqlite3";
import dotenv from "dotenv";

dotenv.config();

const DB_PATH = process.env.DB_PATH || "./database.sqlite";

// Initialize SQLite database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database");
  }
});

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// Initialize database schema
export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create accounts table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY,
          customer_internal_reference TEXT,
          user_reference TEXT,
          workflow_definition_key TEXT,
          callback_url TEXT,
          success_url TEXT,
          error_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,
        (err) => {
          if (err) {
            console.error("Error creating accounts table:", err.message);
            reject(err);
            return;
          }
          console.log("Accounts table ready");
        },
      );

      // Create workflow_executions table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS workflow_executions (
          id TEXT PRIMARY KEY,
          account_id TEXT NOT NULL,
          status TEXT DEFAULT 'INITIATED',
          user_reference TEXT,
          started_at DATETIME,
          completed_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
        )
      `,
        (err) => {
          if (err) {
            console.error(
              "Error creating workflow_executions table:",
              err.message,
            );
            reject(err);
            return;
          }
          console.log("Workflow executions table ready");
        },
      );

      // Create credentials table (stores uploaded documents/images)
      db.run(
        `
        CREATE TABLE IF NOT EXISTS credentials (
          id TEXT PRIMARY KEY,
          workflow_execution_id TEXT NOT NULL,
          category TEXT NOT NULL,
          parts TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workflow_execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE
        )
      `,
        (err) => {
          if (err) {
            console.error("Error creating credentials table:", err.message);
            reject(err);
          } else {
            console.log("Credentials table ready");
            resolve();
          }
        },
      );
    });
  });
};

export default db;
