# API Documentation

## Overview

The Secure Distributed Hash API provides endpoints for user authentication using a distributed hash system that splits password hashes across multiple virtual servers for enhanced security.

## Base URL

```
Local Development: http://localhost:5000
Production: https://your-domain.com
```

## Authentication Flow

The system uses a 5-server distributed architecture:
- **Server A**: Primary metadata + hash block 1
- **Server B**: Authentication history + hash block 2  
- **Server C**: Context information + hash block 3
- **Server D**: Verification data + hash block 4 (first half)
- **Server E**: Recovery data + hash block 4 (second half)

## API Endpoints

### 1. User Registration

**POST** `/api/signup`

Register a new user with distributed hash storage.

#### Request Body
```json
{
  "username": "string",
  "password": "string"
}
```

#### Response (Success)
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다!",
  "hash": "full_concatenated_hash",
  "hashBlocks": {
    "block1": "32bit_hex_hash",
    "block2": "32bit_hex_hash", 
    "block3": "32bit_hex_hash",
    "block4": "32bit_hex_hash"
  }
}
```

#### Response (Error)
```json
{
  "success": false,
  "message": "Error description"
}
```

#### Status Codes
- `200`: Success
- `400`: Invalid input (missing fields, user exists, password too short)
- `500`: Server error

---

### 2. User Authentication

**POST** `/api/login`

Authenticate user by verifying hash fragments across all servers.

#### Request Body
```json
{
  "username": "string",
  "password": "string"
}
```

#### Response (Success)
```json
{
  "success": true,
  "message": "환영합니다, {username}님! 모든 서버에서 인증이 완료되었습니다.",
  "userData": {
    "serverA": {
      "hashFragment": "string",
      "metadata": {
        "username": "string",
        "created": "ISO_timestamp",
        "lastAccess": "ISO_timestamp",
        "userLevel": "standard"
      }
    },
    "serverB": {
      "hashFragment": "string",
      "authHistory": {
        "loginCount": "number",
        "lastLogin": "ISO_timestamp",
        "failedAttempts": "number",
        "loginHistory": ["array_of_login_records"]
      }
    },
    "serverC": {
      "hashFragment": "string", 
      "context": {
        "ipAddress": "string",
        "userAgent": "string",
        "sessionId": "string",
        "location": "string"
      }
    },
    "serverD": {
      "hashFragment": "string",
      "verification": {
        "checksum": "string",
        "integrity": "boolean",
        "lastVerified": "ISO_timestamp"
      }
    },
    "serverE": {
      "hashFragment": "string",
      "recovery": {
        "seed": "string", 
        "backupHash": "string",
        "recoveryKey": "string"
      }
    }
  }
}
```

#### Response (Error)
```json
{
  "success": false,
  "message": "패스워드가 올바르지 않습니다."
}
```

#### Status Codes
- `200`: Success
- `400`: Missing credentials
- `401`: Authentication failed
- `500`: Server error

---

### 3. Server Status

**GET** `/api/server-status`

Get current status of all virtual servers and user data.

#### Response
```json
{
  "status": {
    "A": true,
    "B": true, 
    "C": true,
    "D": true,
    "E": true
  },
  "userData": {
    "username": "user_data_object"
  },
  "userCount": "number",
  "serverInfo": {
    "A": {
      "name": "Primary Server",
      "port": 8001,
      "type": "32bit_hash + user_metadata"
    },
    "B": {
      "name": "Authentication Server", 
      "port": 8002,
      "type": "32bit_hash + auth_history"
    },
    "C": {
      "name": "Context Server",
      "port": 8003, 
      "type": "32bit_hash + context_info"
    },
    "D": {
      "name": "Verification Server",
      "port": 8004,
      "type": "16bit_hash + verification_data"
    },
    "E": {
      "name": "Recovery Server",
      "port": 8005,
      "type": "16bit_hash + recovery_seed"
    }
  }
}
```

---

### 4. Clear Data

**POST** `/api/clear-data`

Clear all user data (development/testing only).

#### Response
```json
{
  "success": true,
  "message": "모든 데이터가 삭제되었습니다."
}
```

---

### 5. Server Configuration

**GET** `/api/server-config`

Get server configuration settings.

#### Response
```json
{
  "servers": ["A", "B", "C", "D", "E"],
  "chaos_params": {
    "r_val": 3.99,
    "key": 314159
  },
  "hash_rounds": 5
}
```

---

### 6. Server Synchronization

**POST** `/api/sync-servers`

Synchronize data across all virtual servers.

#### Response
```json
{
  "success": true,
  "message": "서버 동기화가 완료되었습니다.",
  "results": [
    {
      "server": "A",
      "status": "synced", 
      "recordCount": "number"
    }
  ]
}
```

---

### 7. Health Check

**GET** `/api/health`

Check system health and status.

#### Response
```json
{
  "status": "healthy",
  "timestamp": "ISO_timestamp",
  "servers": {
    "A": true,
    "B": true,
    "C": true, 
    "D": true,
    "E": true
  },
  "totalUsers": "number"
}
```

---

### 8. Debug User Data

**GET** `/api/debug/user/{username}`

Get detailed user data for debugging (development only).

#### Response
```json
{
  "serverA": "user_data_from_server_A",
  "serverB": "user_data_from_server_B", 
  "serverC": "user_data_from_server_C",
  "serverD": "user_data_from_server_D",
  "serverE": "user_data_from_server_E"
}
```

## Security Features

### Hash Generation Algorithm

1. **Chaotic RNG**: Uses chaotic map (logistic equation) with seed-based initialization
2. **Multi-block hashing**: Generates 4 distinct 32-bit hash blocks
3. **Fragment distribution**: Splits final block into 16-bit fragments for servers D and E
4. **Nonlinear mixing**: Applies additional entropy mixing during generation

### Security Benefits

- **Distributed storage**: No single server contains complete authentication data
- **Chaotic unpredictability**: Hash generation uses chaos theory for enhanced randomness  
- **Fragment verification**: Multiple servers must agree for successful authentication
- **Metadata tracking**: Comprehensive audit trail across all authentication attempts

## Error Codes

| Code | Description |
|------|-------------|
| 400  | Bad Request - Invalid input parameters |
| 401  | Unauthorized - Authentication failed |
| 404  | Not Found - User or resource doesn't exist |
| 500  | Internal Server Error - System malfunction |

## Rate Limiting

Current implementation has no rate limiting. For production use, implement:
- Maximum 5 failed login attempts per minute per IP
- Maximum 100 signup requests per hour per IP
- Exponential backoff for repeated failures

## CORS Configuration

The API supports Cross-Origin Resource Sharing (CORS) for all origins in development. For production, configure specific allowed origins in the Flask-CORS settings.