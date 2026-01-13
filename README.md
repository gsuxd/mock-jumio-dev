# Jumio Mock Server

Complete mock implementation of Jumio's Identity Verification API for testing and development purposes.

## 🎯 Features

- ✅ **Full Jumio API Compatibility** - OAuth2, Account Management, Workflow Execution, Retrieval API
- ✅ **Mobile SDK Compatible** - Generate valid SDK tokens for iOS/Android/React Native/Flutter
- ✅ **Hosted Web Interface** - Beautiful UI for iframe/redirect/webview integration
- ✅ **Email-Based Mock Responses** - Different verification results based on email patterns
- ✅ **TypeScript** - Fully typed codebase
- ✅ **SQLite Database** - Persistent storage for accounts and workflows
- ✅ **Hot Reload** - Development mode with automatic restart

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Email Patterns](#email-patterns)
- [Integration Examples](#integration-examples)
- [Web Interface](#web-interface)
- [Mobile SDK Integration](#mobile-sdk-integration)

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

The server will start on `http://localhost:3000`

### Configuration

Edit `.env` file:

```bash
PORT=3000
NODE_ENV=development
DB_PATH=./database.sqlite

# JWT Configuration
JWT_SECRET=jumio-mock-secret-change-in-production

# Mock Credentials (for OAuth2 authentication)
MOCK_CLIENT_ID=your-client-id
MOCK_CLIENT_SECRET=your-client-secret

# Server Configuration
BASE_URL=http://localhost:3000

# Workflow Configuration
CALLBACK_DELAY_MS=2000
SDK_TOKEN_EXPIRY=3600
```

## 📡 API Endpoints

### 1. OAuth2 Authentication

```bash
POST /oauth2/token
Authorization: Basic <base64(client_id:client_secret)>
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
```

**Response:**

```json
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### 2. Create Account / Initiate Workflow

```bash
POST /api/v1/accounts
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "customerInternalReference": "transaction_123",
  "userReference": "user@example.com",
  "workflowDefinition": {
    "key": "10164"
  },
  "callbackUrl": "https://yourapp.com/callback",
  "successUrl": "https://yourapp.com/success",
  "errorUrl": "https://yourapp.com/error"
}
```

**Response:**

```json
{
  "timestamp": "2026-01-13T19:21:40.758Z",
  "account": {
    "id": "acc_c6439cc4be800fafaf677a5b3375da4f"
  },
  "web": {
    "href": "http://localhost:3000/workflow/wfe_1cd13524...",
    "successUrl": "http://localhost:3000/success",
    "errorUrl": "http://localhost:3000/error"
  },
  "sdk": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "workflowExecution": {
    "id": "wfe_1cd13524f281a8431d1ea472fd6ba284",
    "credentials": [...]
  }
}
```

### 3. Retrieve Workflow Results

```bash
GET /api/v1/accounts/{accountId}/workflow-executions/{workflowExecutionId}
Authorization: Bearer <access_token>
```

**Response (Approved):**

```json
{
  "timestamp": "2026-01-13T19:21:58.521Z",
  "account": {
    "id": "acc_c6439cc4be800fafaf677a5b3375da4f"
  },
  "workflowExecution": {
    "id": "wfe_1cd13524f281a8431d1ea472fd6ba284",
    "status": "APPROVED_VERIFIED",
    "definition": {
      "key": "10164",
      "name": "ID + Selfie Verification"
    }
  },
  "decision": {
    "type": "ACCEPTED",
    "details": {
      "label": "OK"
    }
  },
  "capabilities": {
    "extraction": {
      "data": {
        "document": {
          "type": "DRIVING_LICENSE",
          "country": "USA",
          "firstName": "John",
          "lastName": "Doe",
          "dateOfBirth": "1990-01-15",
          "documentNumber": "DL123456789",
          "address": {
            "line1": "123 Main Street",
            "city": "San Francisco",
            "subdivision": "CA",
            "postalCode": "94102",
            "country": "USA"
          }
        }
      }
    },
    "similarity": {
      "decision": "MATCH",
      "score": 0.95
    },
    "liveness": {
      "decision": "PASSED",
      "score": 0.98
    },
    "authentication": {
      "decision": "AUTHENTIC",
      "score": 0.92
    }
  }
}
```

## 🎭 Email Patterns

The mock server returns different verification results based on the `userReference` email:

| Email Pattern | Verification Status            | Decision Type | Use Case                |
| ------------- | ------------------------------ | ------------- | ----------------------- |
| `approved@*`  | `APPROVED_VERIFIED`            | `ACCEPTED`    | Successful verification |
| `success@*`   | `APPROVED_VERIFIED`            | `ACCEPTED`    | Successful verification |
| `rejected@*`  | `REJECTED_UNSUPPORTED_ID_TYPE` | `REJECTED`    | Failed verification     |
| `failed@*`    | `REJECTED_UNSUPPORTED_ID_TYPE` | `REJECTED`    | Failed verification     |
| `review@*`    | `REQUIRES_MANUAL_REVIEW`       | `REVIEW`      | Manual review required  |
| `manual@*`    | `REQUIRES_MANUAL_REVIEW`       | `REVIEW`      | Manual review required  |
| **Other**     | `APPROVED_VERIFIED`            | `ACCEPTED`    | Default success         |

### Examples

```bash
# Will return APPROVED status
"userReference": "approved@test.com"
"userReference": "john.doe@example.com"

# Will return REJECTED status
"userReference": "rejected@test.com"
"userReference": "failed@company.com"

# Will return MANUAL_REVIEW status
"userReference": "review@test.com"
"userReference": "manual@company.com"
```

## 🌐 Web Interface

The mock server includes a beautiful hosted web interface for testing iframe/redirect/webview integrations.

### Access the Interface

After creating an account, use the `web.href` URL:

```
http://localhost:3000/workflow/{workflowExecutionId}
```

### Features

- 📸 Document upload simulation (front/back of ID)
- 🤳 Selfie capture simulation
- ⏳ Progress indicators
- ✅ Success/error redirects
- 📱 Responsive design (mobile & desktop)
- 🎨 Modern, beautiful UI

### Integration Options

#### Option 1: Redirect

```javascript
window.location.href = response.web.href;
```

#### Option 2: iFrame

```html
<iframe
  src="http://localhost:3000/workflow/wfe_..."
  width="100%"
  height="700px"
  frameborder="0"
>
</iframe>
```

#### Option 3: WebView (React Native)

```javascript
<WebView source={{ uri: response.web.href }} />
```

## 📱 Mobile SDK Integration

The mock server is fully compatible with Jumio's Mobile SDK.

### Integration Flow

1. **Backend**: Authenticate and create account

```javascript
// Your backend
const token = await getOAuth2Token();
const account = await createAccount(token, {
  userReference: "user@example.com",
  workflowDefinition: { key: "10164" },
});

// Send SDK token to mobile app
return { sdkToken: account.sdk.token };
```

2. **Mobile App**: Initialize SDK with token

```swift
// iOS Example
let sdk = Jumio.SDK()
sdk.token = sdkToken
sdk.start()
```

```kotlin
// Android Example
val sdk = JumioSDK()
sdk.token = sdkToken
sdk.start()
```

3. **Backend**: Retrieve results after callback

```javascript
const results = await getWorkflowResults(accountId, workflowExecutionId);
```

### SDK Token Format

The mock server generates valid JWT tokens with required claims:

```json
{
  "accountId": "acc_...",
  "workflowExecutionId": "wfe_...",
  "type": "sdk",
  "iat": 1768332100,
  "exp": 1768335700,
  "iss": "http://localhost:3000"
}
```

## 🔧 Development

### Project Structure

```
mock-jumio/
├── src/
│   ├── config/
│   │   └── database.ts          # SQLite configuration
│   ├── controllers/
│   │   ├── authController.ts    # OAuth2 endpoints
│   │   ├── accountController.ts # Account management
│   │   ├── retrievalController.ts # Results retrieval
│   │   └── webController.ts     # Web interface
│   ├── middleware/
│   │   └── auth.ts              # Authentication middleware
│   ├── services/
│   │   └── mockDataService.ts   # Mock data generation
│   ├── utils/
│   │   ├── jwt.ts               # JWT utilities
│   │   └── idGenerator.ts       # ID generation
│   ├── views/
│   │   └── workflow.html        # Hosted web interface
│   ├── routes/
│   │   └── index.ts             # API routes
│   └── index.ts                 # Main server
├── package.json
├── tsconfig.json
└── .env
```

### Build & Run

```bash
# Development mode (hot reload)
npm run dev

# Build TypeScript
npm run build

# Production mode
npm start
```

## 🧪 Testing Examples

### Complete Flow Test

```bash
# 1. Get OAuth2 token
TOKEN=$(curl -s -X POST http://localhost:3000/oauth2/token \
  -u "your-client-id:your-client-secret" \
  -d "grant_type=client_credentials" | jq -r '.access_token')

# 2. Create account
RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerInternalReference": "test_123",
    "userReference": "approved@test.com",
    "workflowDefinition": {"key": "10164"}
  }')

ACCOUNT_ID=$(echo $RESPONSE | jq -r '.account.id')
WORKFLOW_ID=$(echo $RESPONSE | jq -r '.workflowExecution.id')
WEB_URL=$(echo $RESPONSE | jq -r '.web.href')

echo "Web Interface: $WEB_URL"

# 3. Get results
curl -s "http://localhost:3000/api/v1/accounts/$ACCOUNT_ID/workflow-executions/$WORKFLOW_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

## 📚 Documentation

- [Jumio Official Documentation](https://documentation.jumio.ai)
- [Jumio SDK Documentation](https://documentation.jumio.ai/docs/developer-resources/SDKs/introduction)
- [Jumio API Reference](https://documentation.jumio.ai/docs/developer-resources/API/Integration_Intro)

## 🔒 Security Notes

⚠️ **This is a MOCK server for testing purposes only!**

- Do not use in production
- Change default credentials in `.env`
- Use strong JWT secrets
- The mock server accepts any valid JWT format

## 📝 License

MIT

## 🤝 Contributing

This is a mock server for testing. Feel free to extend it with additional Jumio endpoints or features.

---

**Made with ❤️ for Jumio integration testing**
