// Determine verification status based on email pattern
export const getVerificationStatusFromEmail = (
  email?: string,
):
  | "APPROVED_VERIFIED"
  | "REJECTED_UNSUPPORTED_ID_TYPE"
  | "REQUIRES_MANUAL_REVIEW" => {
  if (!email) {
    return "APPROVED_VERIFIED";
  }

  const lowerEmail = email.toLowerCase();

  if (lowerEmail.includes("rejected") || lowerEmail.includes("failed")) {
    return "REJECTED_UNSUPPORTED_ID_TYPE";
  }

  if (lowerEmail.includes("review") || lowerEmail.includes("manual")) {
    return "REQUIRES_MANUAL_REVIEW";
  }

  // Default: approved (includes 'approved', 'success', and any other email)
  return "APPROVED_VERIFIED";
};

// Generate mock document data based on email
export const generateMockDocumentData = (email?: string) => {
  const status = getVerificationStatusFromEmail(email);
  const isApproved = status === "APPROVED_VERIFIED";

  return {
    type: "DRIVING_LICENSE",
    country: "USA",
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: "1990-01-15",
    expiryDate: "2028-12-31",
    issuingDate: "2023-01-15",
    documentNumber:
      "DL" + Math.random().toString(36).substring(2, 11).toUpperCase(),
    address: {
      line1: "123 Main Street",
      city: "San Francisco",
      subdivision: "CA",
      postalCode: "94102",
      country: "USA",
    },
  };
};

// Generate mock verification result
export const generateMockVerificationResult = (
  email?: string,
  userReference?: string,
) => {
  const status = getVerificationStatusFromEmail(email);
  const isApproved = status === "APPROVED_VERIFIED";
  const isRejected = status === "REJECTED_UNSUPPORTED_ID_TYPE";
  const documentData = generateMockDocumentData(email);

  const result: any = {
    timestamp: new Date().toISOString(),
    account: {
      id: userReference || "mock-account-id",
    },
    workflowExecution: {
      id: "mock-workflow-execution-id",
      status: status,
      definition: {
        key: "10164",
        name: "ID + Selfie Verification",
      },
      startedAt: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
      completedAt: new Date().toISOString(),
    },
    decision: {
      type: isApproved ? "ACCEPTED" : isRejected ? "REJECTED" : "REVIEW",
      details: {
        label: isApproved ? "OK" : isRejected ? "REJECTED" : "MANUAL_REVIEW",
      },
    },
  };

  // Add capabilities for approved/review cases
  if (isApproved || status === "REQUIRES_MANUAL_REVIEW") {
    result.capabilities = {
      extraction: {
        data: {
          document: documentData,
          usAddress: documentData.address,
        },
      },
      similarity: {
        decision: isApproved ? "MATCH" : "REVIEW",
        score: isApproved ? 0.95 : 0.75,
      },
      liveness: {
        decision: isApproved ? "PASSED" : "REVIEW",
        score: isApproved ? 0.98 : 0.72,
      },
      authentication: {
        decision: isApproved ? "AUTHENTIC" : "REVIEW",
        score: isApproved ? 0.92 : 0.68,
      },
      imageQuality: {
        decision: "PASSED",
        score: 0.88,
      },
    };
  }

  // Add rejection reasons for rejected cases
  if (isRejected) {
    result.rejectReason = {
      rejectReasonCode: "UNSUPPORTED_ID_TYPE",
      rejectReasonDescription: "The provided document type is not supported",
      rejectReasonDetails: [
        {
          detailsCode: "DOCUMENT_NOT_SUPPORTED",
          detailsDescription: "Document verification failed",
        },
      ],
    };
  }

  return result;
};

// Generate progressive workflow result based on time elapsed
export const generateProgressiveWorkflowResult = (
  email: string | undefined,
  accountId: string,
  workflowExecutionId: string,
  createdAt: string,
  completedAt: string | null,
  userReference?: string,
) => {
  const callbackDelayMs = parseInt(process.env.CALLBACK_DELAY_MS || "2000", 10);
  const now = Date.now();
  const createdTime = new Date(createdAt).getTime();
  const elapsedMs = now - createdTime;

  // If workflow is marked as completed, return final result with PROCESSED status
  if (completedAt) {
    const result = generateMockVerificationResult(email, accountId);
    result.account.id = accountId;
    result.workflowExecution.id = workflowExecutionId;
    result.workflowExecution.status = "PROCESSED";
    result.workflowExecution.startedAt = createdAt;
    result.workflowExecution.completedAt = completedAt;
    return result;
  }

  // State progression based on CALLBACK_DELAY_MS
  const halfDelay = callbackDelayMs / 2;

  // INITIATED state (0 - 50% of delay)
  // Workflow has been created but processing hasn't started yet
  if (elapsedMs < halfDelay) {
    return {
      timestamp: new Date().toISOString(),
      account: {
        id: accountId,
      },
      workflowExecution: {
        id: workflowExecutionId,
        status: "INITIATED",
        definition: {
          key: "10164",
          name: "ID + Selfie Verification",
        },
        startedAt: createdAt,
      },
    };
  }

  // PROCESSING state (50% - 100% of delay)
  // Workflow is actively being processed
  if (elapsedMs < callbackDelayMs) {
    return {
      timestamp: new Date().toISOString(),
      account: {
        id: accountId,
      },
      workflowExecution: {
        id: workflowExecutionId,
        status: "PROCESSING",
        definition: {
          key: "10164",
          name: "ID + Selfie Verification",
        },
        startedAt: createdAt,
      },
    };
  }

  // PROCESSED state (after delay has passed)
  // Return final result with all capabilities
  const result = generateMockVerificationResult(email, accountId);
  result.account.id = accountId;
  result.workflowExecution.id = workflowExecutionId;
  result.workflowExecution.status = "PROCESSED";
  result.workflowExecution.startedAt = createdAt;
  result.workflowExecution.completedAt = new Date().toISOString();
  return result;
};

// Generate account creation response
export const generateAccountResponse = (
  accountId: string,
  workflowExecutionId: string,
  sdkToken: string,
  apiToken: string,
  customerInternalReference?: string,
  successUrl?: string,
  errorUrl?: string,
) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";

  return {
    timestamp: new Date().toISOString(),
    account: {
      id: accountId,
    },
    web: {
      href: `${baseUrl}/workflow/${workflowExecutionId}`,
      successUrl: successUrl || `${baseUrl}/success`,
      errorUrl: errorUrl || `${baseUrl}/error`,
    },
    sdk: {
      token: sdkToken,
    },
    workflowExecution: {
      id: workflowExecutionId,
      credentials: [
        {
          id: `crd_id_${Date.now()}`,
          category: "ID",
          label: "Identity Document",
          allowedChannels: ["WEB", "API", "SDK"],
          api: {
            token: apiToken,
            workflowExecution: `${baseUrl}/api/v1/workflow-executions/${workflowExecutionId}`,
            parts: {
              front: `${baseUrl}/api/v1/workflow-executions/${workflowExecutionId}/parts/FRONT`,
              back: `${baseUrl}/api/v1/workflow-executions/${workflowExecutionId}/parts/BACK`,
            },
          },
        },
        {
          id: `crd_selfie_${Date.now()}`,
          category: "SELFIE",
          label: "Selfie",
          allowedChannels: ["WEB", "API", "SDK"],
          api: {
            token: apiToken,
            workflowExecution: `${baseUrl}/api/v1/workflow-executions/${workflowExecutionId}`,
            parts: {
              face: `${baseUrl}/api/v1/workflow-executions/${workflowExecutionId}/parts/FACE`,
            },
          },
        },
      ],
    },
  };
};

// Generate callback payload
export const generateCallbackPayload = (
  accountId: string,
  workflowExecutionId: string,
  status: string,
) => {
  return {
    timestamp: new Date().toISOString(),
    account: {
      id: accountId,
    },
    workflowExecution: {
      id: workflowExecutionId,
      status: status,
    },
  };
};
