// hash_server.js - JavaScript version of hash_server.cpp
// This represents the main server functionality

// Import dependencies (assuming they're available)
// In browser: include via script tags
// In Node.js: use require()

class HashServer {
    constructor() {
        this.sessions = new Map();
        this.userDatabase = new Map();
        this.serverConfig = {
            port: 8080,
            maxSessions: 1000,
            sessionTimeout: 3600, // 1 hour
            maxLoginAttempts: 5,
            lockoutDuration: 900 // 15 minutes
        };
        
        console.log("HashServer initialized");
        this.startServer();
    }

    /**
     * Simulate server startup
     */
    startServer() {
        console.log(`Hash Server starting on port ${this.serverConfig.port}`);
        console.log("Server ready to handle authentication requests");
        
        // In a real implementation, this would start an HTTP server
        // For demo purposes, we'll just log the startup
        this.isRunning = true;
        
        // Cleanup old sessions periodically
        setInterval(() => {
            this.cleanupSessions();
        }, 60000); // Every minute
    }

    /**
     * Handle user registration
     * @param {string} username - Username
     * @param {string} password - Password
     * @param {number} seed - Seed for hashing
     * @returns {Object} Registration result
     */
    registerUser(username, password, seed = null) {
        console.log(`Registration attempt for user: ${username}`);
        
        if (this.userDatabase.has(username)) {
            return {
                success: false,
                message: "Username already exists",
                errorCode: "USER_EXISTS"
            };
        }

        if (!this.validatePassword(password)) {
            return {
                success: false,
                message: "Password does not meet requirements",
                errorCode: "WEAK_PASSWORD"
            };
        }

        // Generate seed if not provided
        if (!seed) {
            seed = Math.floor(Math.random() * 0xFFFFFFFF);
        }

        try {
            // Generate hash using CustomHash
            const serverData = CustomHash.splitForServers(username, password, seed);
            
            // Store user data
            this.userDatabase.set(username, {
                serverData: serverData,
                seed: seed,
                createdAt: Date.now(),
                lastLogin: null,
                loginAttempts: 0,
                lockedUntil: null
            });

            console.log(`User ${username} registered successfully`);
            
            return {
                success: true,
                message: "User registered successfully",
                userId: username,
                seed: seed
            };

        } catch (error) {
            console.error("Registration error:", error);
            return {
                success: false,
                message: "Internal server error during registration",
                errorCode: "INTERNAL_ERROR"
            };
        }
    }

    /**
     * Handle user authentication
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Object} Authentication result
     */
    authenticateUser(username, password) {
        console.log(`Authentication attempt for user: ${username}`);
        
        const user = this.userDatabase.get(username);
        if (!user) {
            console.log(`Authentication failed: User ${username} not found`);
            return {
                success: false,
                message: "Invalid credentials",
                errorCode: "INVALID_CREDENTIALS"
            };
        }

        // Check if user is locked out
        if (user.lockedUntil && Date.now() < user.lockedUntil) {
            const remainingTime = Math.ceil((user.lockedUntil - Date.now()) / 1000);
            console.log(`Authentication failed: User ${username} locked for ${remainingTime}s`);
            return {
                success: false,
                message: `Account locked. Try again in ${remainingTime} seconds`,
                errorCode: "ACCOUNT_LOCKED"
            };
        }

        try {
            // Verify hash
            const isValid = CustomHash.verifyHash(username, password, user.seed, user.serverData);
            
            if (isValid) {
                // Reset login attempts on successful login
                user.loginAttempts = 0;
                user.lastLogin = Date.now();
                user.lockedUntil = null;

                // Create session
                const sessionId = this.createSession(username);
                
                console.log(`Authentication successful for user: ${username}`);
                
                return {
                    success: true,
                    message: "Authentication successful",
                    sessionId: sessionId,
                    userId: username
                };

            } else {
                // Increment login attempts
                user.loginAttempts++;
                
                if (user.loginAttempts >= this.serverConfig.maxLoginAttempts) {
                    user.lockedUntil = Date.now() + (this.serverConfig.lockoutDuration * 1000);
                    console.log(`User ${username} locked due to too many failed attempts`);
                }

                console.log(`Authentication failed for user: ${username} (attempt ${user.loginAttempts})`);
                
                return {
                    success: false,
                    message: "Invalid credentials",
                    errorCode: "INVALID_CREDENTIALS",
                    attemptsRemaining: Math.max(0, this.serverConfig.maxLoginAttempts - user.loginAttempts)
                };
            }

        } catch (error) {
            console.error("Authentication error:", error);
            return {
                success: false,
                message: "Internal server error during authentication",
                errorCode: "INTERNAL_ERROR"
            };
        }
    }

    /**
     * Create a new session
     * @param {string} username - Username
     * @returns {string} Session ID
     */
    createSession(username) {
        const sessionId = this.generateSessionId();
        const session = {
            userId: username,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            ipAddress: "127.0.0.1", // In real implementation, get from request
            userAgent: "HashServer/1.0"
        };
        
        this.sessions.set(sessionId, session);
        return sessionId;
    }

    /**
     * Validate session
     * @param {string} sessionId - Session ID
     * @returns {Object} Session validation result
     */
    validateSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return {
                valid: false,
                message: "Invalid session",
                errorCode: "INVALID_SESSION"
            };
        }

        // Check session timeout
        const now = Date.now();
        const sessionAge = now - session.lastActivity;
        if (sessionAge > this.serverConfig.sessionTimeout * 1000) {
            this.sessions.delete(sessionId);
            return {
                valid: false,
                message: "Session expired",
                errorCode: "SESSION_EXPIRED"
            };
        }

        // Update last activity
        session.lastActivity = now;
        
        return {
            valid: true,
            userId: session.userId,
            session: session
        };
    }

    /**
     * Logout user (destroy session)
     * @param {string} sessionId - Session ID
     * @returns {Object} Logout result
     */
    logout(sessionId) {
        if (this.sessions.has(sessionId)) {
            const session = this.sessions.get(sessionId);
            this.sessions.delete(sessionId);
            console.log(`User ${session.userId} logged out`);
            
            return {
                success: true,
                message: "Logged out successfully"
            };
        }
        
        return {
            success: false,
            message: "Invalid session",
            errorCode: "INVALID_SESSION"
        };
    }

    /**
     * Generate unique session ID
     * @returns {string} Session ID
     */
    generateSessionId() {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substr(2, 9);
        const rng = new ChaoticRNG(Date.now());
        const chaoticPart = rng.next().toString(36);
        
        return `sess_${timestamp}_${randomPart}_${chaoticPart}`;
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {boolean} Is password valid
     */
    validatePassword(password) {
        if (!password || password.length < 8) {
            return false;
        }
        
        // Check for at least one uppercase, one lowercase, and one number
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        
        return hasUpper && hasLower && hasNumber;
    }

    /**
     * Cleanup expired sessions
     */
    cleanupSessions() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [sessionId, session] of this.sessions.entries()) {
            const sessionAge = now - session.lastActivity;
            if (sessionAge > this.serverConfig.sessionTimeout * 1000) {
                this.sessions.delete(sessionId);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`Cleaned up ${cleaned} expired sessions`);
        }
    }

    /**
     * Get server statistics
     * @returns {Object} Server statistics
     */
    getStats() {
        const now = Date.now();
        let activeSessions = 0;
        let lockedUsers = 0;
        
        // Count active sessions
        for (const session of this.sessions.values()) {
            const sessionAge = now - session.lastActivity;
            if (sessionAge <= this.serverConfig.sessionTimeout * 1000) {
                activeSessions++;
            }
        }
        
        // Count locked users
        for (const user of this.userDatabase.values()) {
            if (user.lockedUntil && now < user.lockedUntil) {
                lockedUsers++;
            }
        }
        
        return {
            totalUsers: this.userDatabase.size,
            activeSessions: activeSessions,
            totalSessions: this.sessions.size,
            lockedUsers: lockedUsers,
            uptime: now - this.startTime || 0,
            serverConfig: this.serverConfig
        };
    }

    /**
     * Handle hash verification request (API endpoint simulation)
     * @param {Object} request - Request object
     * @returns {Object} Response object
     */
    handleHashVerification(request) {
        const { username, password, seed, sessionId } = request;
        
        // Validate session if provided
        if (sessionId) {
            const sessionValidation = this.validateSession(sessionId);
            if (!sessionValidation.valid) {
                return {
                    status: 401,
                    success: false,
                    message: sessionValidation.message,
                    errorCode: sessionValidation.errorCode
                };
            }
        }

        try {
            const user = this.userDatabase.get(username);
            if (!user) {
                return {
                    status: 404,
                    success: false,
                    message: "User not found",
                    errorCode: "USER_NOT_FOUND"
                };
            }

            const isValid = CustomHash.verifyHash(username, password, seed || user.seed, user.serverData);
            
            return {
                status: 200,
                success: true,
                verified: isValid,
                message: isValid ? "Hash verified successfully" : "Hash verification failed"
            };

        } catch (error) {
            console.error("Hash verification error:", error);
            return {
                status: 500,
                success: false,
                message: "Internal server error",
                errorCode: "INTERNAL_ERROR"
            };
        }
    }

    /**
     * Perform server diagnostics
     * @returns {Object} Diagnostic results
     */
    runDiagnostics() {
        console.log("=== Server Diagnostics ===");
        
        const results = {
            systemHealth: "OK",
            issues: [],
            performance: {},
            security: {}
        };

        // Test hash performance
        const startTime = performance.now();
        for (let i = 0; i < 1000; i++) {
            CustomHash.hashString(`test${i}`, 12345);
        }
        const endTime = performance.now();
        
        results.performance.hashSpeed = {
            operations: 1000,
            timeMs: endTime - startTime,
            opsPerSecond: Math.round(1000 / (endTime - startTime) * 1000)
        };

        // Check session limits
        if (this.sessions.size > this.serverConfig.maxSessions * 0.8) {
            results.issues.push("High session count - consider cleanup");
        }

        // Test RNG functionality
        try {
            const rng1 = new ChaoticRNG(12345);
            const rng2 = new SlightlyHardRNG(12345);
            const val1 = rng1.next();
            const val2 = rng2.next();
            
            if (val1 === 0 || val2 === 0) {
                results.issues.push("RNG producing zero values");
                results.systemHealth = "WARNING";
            }
            
            results.security.rngTest = "PASS";
        } catch (error) {
            results.issues.push(`RNG Error: ${error.message}`);
            results.systemHealth = "ERROR";
            results.security.rngTest = "FAIL";
        }

        // Memory usage check (simplified)
        results.performance.memory = {
            users: this.userDatabase.size,
            sessions: this.sessions.size,
            estimatedMemoryMB: (this.userDatabase.size * 2 + this.sessions.size * 0.5) / 1024
        };

        console.log("Diagnostics completed:", results);
        return results;
    }

    /**
     * Shutdown server gracefully
     */
    shutdown() {
        console.log("Shutting down Hash Server...");
        
        // Clear all sessions
        this.sessions.clear();
        
        // In a real implementation, close database connections, stop HTTP server, etc.
        this.isRunning = false;
        
        console.log("Hash Server shutdown complete");
    }
}

// === Main Server Functions ===

/**
 * Main function - equivalent to main() in C++
 */
function main() {
    console.log("Starting SecureAuth Hash Server...");
    
    // Initialize server
    const server = new HashServer();
    
    // Demo usage
    console.log("\n=== Demo Usage ===");
    
    // Register a user
    const regResult = server.registerUser("testuser", "SecurePass123");
    console.log("Registration result:", regResult);
    
    if (regResult.success) {
        // Authenticate the user
        const authResult = server.authenticateUser("testuser", "SecurePass123");
        console.log("Authentication result:", authResult);
        
        if (authResult.success) {
            // Validate session
            const sessionResult = server.validateSession(authResult.sessionId);
            console.log("Session validation:", sessionResult);
            
            // Test hash verification
            const hashVerifyResult = server.handleHashVerification({
                username: "testuser",
                password: "SecurePass123",
                sessionId: authResult.sessionId
            });
            console.log("Hash verification:", hashVerifyResult);
            
            // Get server stats
            const stats = server.getStats();
            console.log("Server stats:", stats);
            
            // Logout
            const logoutResult = server.logout(authResult.sessionId);
            console.log("Logout result:", logoutResult);
        }
    }
    
    // Run diagnostics
    server.runDiagnostics();
    
    // For demo purposes, shutdown after a delay
    setTimeout(() => {
        server.shutdown();
    }, 1000);
}

// === Export for use in other files ===
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HashServer, main };
}

// === Browser/Node.js compatibility ===
if (typeof window !== 'undefined') {
    // Browser environment
    window.HashServer = HashServer;
    window.hashServerMain = main;
} else if (typeof global !== 'undefined') {
    // Node.js environment
    global.HashServer = HashServer;
    global.hashServerMain = main;
}

// Auto-run main if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    main();
}