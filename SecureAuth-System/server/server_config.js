// server_config.js - JavaScript version of server_config.json
// Configuration module for SecureAuth System

/**
 * Main configuration object for the SecureAuth Distributed Password System
 */
const ServerConfig = {
    systemInfo: {
        name: "SecureAuth Distributed Password System",
        version: "1.0.0",
        description: "5-Way Split Hash Server Architecture with ChaoticRNG",
        buildDate: "2024-12-28",
        platform: "JavaScript/Web"
    },
    
    hashConfig: {
        algorithm: "ChaoticRNG + SlightlyHardRNG Hybrid",
        hashSize: 128,
        blockSize: 32,
        splitMethod: "5-way",
        chaoticParams: {
            defaultSeed: 314159,
            rValue: 3.99,
            keyMod: 101
        },
        hardRngParams: {
            workBits: 26,
            pepperMask: 0xFFFFFFFF
        }
    },
    
    serverDistribution: {
        serverA: {
            name: "Primary Server",
            port: 8001,
            dataType: "32bit_hash + user_metadata",
            role: "primary",
            backupEnabled: true
        },
        serverB: {
            name: "Authentication Server", 
            port: 8002,
            dataType: "32bit_hash + auth_history",
            role: "authentication",
            backupEnabled: true
        },
        serverC: {
            name: "Context Server",
            port: 8003,
            dataType: "32bit_hash + context_info",
            role: "context",
            backupEnabled: false
        },
        serverD: {
            name: "Verification Server",
            port: 8004,
            dataType: "16bit_hash + verification_data",
            role: "verification", 
            backupEnabled: true
        },
        serverE: {
            name: "Recovery Server",
            port: 8005,
            dataType: "16bit_hash + recovery_seed",
            role: "recovery",
            backupEnabled: true
        }
    },
    
    securitySettings: {
        minPasswordLength: 6,
        maxFailedAttempts: 5,
        accountLockoutDuration: 300, // seconds
        sessionTimeout: 3600, // seconds
        requireAllServers: true,
        integrityCheckInterval: 86400 // seconds
    },
    
    logging: {
        enabled: true,
        level: "INFO",
        file: "logs/secureauth.log",
        maxSize: "100MB",
        backupCount: 5,
        logAuthAttempts: true,
        logHashOperations: false
    },
    
    performance: {
        maxConcurrentUsers: 1000,
        hashCacheSize: 10000,
        cacheTimeout: 1800, // seconds
        threadPoolSize: 8,
        benchmarkOnStartup: true
    },
    
    backupSettings: {
        enabled: true,
        interval: 3600, // seconds
        directory: "backups/",
        compression: true,
        encryption: true,
        retentionDays: 30
    },
    
    network: {
        bindAddress: "0.0.0.0",
        sslEnabled: true,
        sslCert: "certs/server.crt",
        sslKey: "certs/server.key",
        maxConnections: 100,
        timeout: 30 // seconds
    },
    
    database: {
        type: "memory",
        persistentBackup: true,
        backupFile: "data/users.db",
        encryption: true,
        compression: true
    },
    
    monitoring: {
        enabled: true,
        metricsPort: 9090,
        healthCheckInterval: 60, // seconds
        alertOnFailure: true,
        emailAlerts: false,
        webhookUrl: ""
    },
    
    development: {
        debugMode: false,
        verboseLogging: false,
        testMode: false,
        mockServers: false,
        performanceProfiling: false
    }
};

/**
 * Configuration utility functions
 */
const ConfigUtils = {
    /**
     * Get configuration value by path (e.g., "hashConfig.algorithm")
     * @param {string} path - Dot-separated path to config value
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Configuration value
     */
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let current = ServerConfig;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }
        
        return current;
    },
    
    /**
     * Set configuration value by path
     * @param {string} path - Dot-separated path to config value
     * @param {*} value - Value to set
     */
    set(path, value) {
        const keys = path.split('.');
        let current = ServerConfig;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
    },
    
    /**
     * Validate configuration
     * @returns {Object} Validation result
     */
    validate() {
        const issues = [];
        
        // Check required fields
        if (!ServerConfig.systemInfo.name) {
            issues.push("System name is required");
        }
        
        if (ServerConfig.securitySettings.minPasswordLength < 4) {
            issues.push("Minimum password length should be at least 4");
        }
        
        if (ServerConfig.securitySettings.maxFailedAttempts < 1) {
            issues.push("Max failed attempts should be at least 1");
        }
        
        // Check server distribution
        const servers = ServerConfig.serverDistribution;
        const ports = new Set();
        
        for (const [serverKey, serverConfig] of Object.entries(servers)) {
            if (ports.has(serverConfig.port)) {
                issues.push(`Duplicate port ${serverConfig.port} for ${serverKey}`);
            }
            ports.add(serverConfig.port);
            
            if (!serverConfig.name) {
                issues.push(`Server ${serverKey} missing name`);
            }
        }
        
        return {
            valid: issues.length === 0,
            issues: issues
        };
    },
    
    /**
     * Get all server configurations
     * @returns {Array} Array of server configurations
     */
    getServers() {
        return Object.entries(ServerConfig.serverDistribution).map(([key, config]) => ({
            id: key,
            ...config
        }));
    },
    
    /**
     * Get server configuration by role
     * @param {string} role - Server role
     * @returns {Object|null} Server configuration
     */
    getServerByRole(role) {
        for (const [key, config] of Object.entries(ServerConfig.serverDistribution)) {
            if (config.role === role) {
                return { id: key, ...config };
            }
        }
        return null;
    },
    
    /**
     * Check if development mode is enabled
     * @returns {boolean}
     */
    isDevelopmentMode() {
        return ServerConfig.development.debugMode || 
               ServerConfig.development.testMode;
    },
    
    /**
     * Get chaotic RNG configuration
     * @returns {Object} Chaotic RNG parameters
     */
    getChaoticRNGConfig() {
        return ServerConfig.hashConfig.chaoticParams;
    },
    
    /**
     * Get SlightlyHardRNG configuration
     * @returns {Object} SlightlyHardRNG parameters
     */
    getHardRNGConfig() {
        return ServerConfig.hashConfig.hardRngParams;
    },
    
    /**
     * Export configuration as JSON string
     * @param {boolean} pretty - Whether to format JSON
     * @returns {string} JSON string
     */
    toJSON(pretty = false) {
        return JSON.stringify(ServerConfig, null, pretty ? 2 : 0);
    },
    
    /**
     * Load configuration from JSON string
     * @param {string} jsonString - JSON configuration
     */
    fromJSON(jsonString) {
        try {
            const config = JSON.parse(jsonString);
            Object.assign(ServerConfig, config);
        } catch (error) {
            console.error("Failed to load configuration:", error);
            throw new Error("Invalid JSON configuration");
        }
    },
    
    /**
     * Reset configuration to defaults
     */
    reset() {
        // This would restore default values
        console.warn("Configuration reset not implemented");
    },
    
    /**
     * Print configuration summary
     */
    printSummary() {
        console.log("=== SecureAuth Configuration Summary ===");
        console.log(`System: ${ServerConfig.systemInfo.name} v${ServerConfig.systemInfo.version}`);
        console.log(`Hash Algorithm: ${ServerConfig.hashConfig.algorithm}`);
        console.log(`Hash Size: ${ServerConfig.hashConfig.hashSize}-bit`);
        console.log(`Split Method: ${ServerConfig.hashConfig.splitMethod}`);
        console.log(`Servers: ${Object.keys(ServerConfig.serverDistribution).length}`);
        console.log(`Security: Password min ${ServerConfig.securitySettings.minPasswordLength}, max attempts ${ServerConfig.securitySettings.maxFailedAttempts}`);
        console.log(`Performance: Max users ${ServerConfig.performance.maxConcurrentUsers}`);
        console.log(`Development Mode: ${this.isDevelopmentMode() ? 'ON' : 'OFF'}`);
        
        const validation = this.validate();
        console.log(`Configuration Valid: ${validation.valid ? 'YES' : 'NO'}`);
        if (!validation.valid) {
            console.log("Issues:", validation.issues);
        }
    }
};

/**
 * Environment-specific configuration overrides
 */
const EnvironmentConfig = {
    /**
     * Apply development overrides
     */
    development() {
        ServerConfig.development.debugMode = true;
        ServerConfig.development.verboseLogging = true;
        ServerConfig.logging.level = "DEBUG";
        ServerConfig.securitySettings.minPasswordLength = 4; // Relaxed for testing
        console.log("Applied development configuration overrides");
    },
    
    /**
     * Apply production overrides
     */
    production() {
        ServerConfig.development.debugMode = false;
        ServerConfig.development.verboseLogging = false;
        ServerConfig.logging.level = "WARN";
        ServerConfig.securitySettings.minPasswordLength = 8; // Stricter for production
        ServerConfig.network.sslEnabled = true;
        console.log("Applied production configuration overrides");
    },
    
    /**
     * Apply testing overrides
     */
    testing() {
        ServerConfig.development.testMode = true;
        ServerConfig.database.type = "memory";
        ServerConfig.database.persistentBackup = false;
        ServerConfig.performance.benchmarkOnStartup = false;
        console.log("Applied testing configuration overrides");
    }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = {
        ServerConfig,
        ConfigUtils,
        EnvironmentConfig
    };
} else if (typeof window !== 'undefined') {
    // Browser
    window.ServerConfig = ServerConfig;
    window.ConfigUtils = ConfigUtils;
    window.EnvironmentConfig = EnvironmentConfig;
}

// Auto-detect environment and apply overrides
if (typeof process !== 'undefined' && process.env) {
    const env = process.env.NODE_ENV || 'development';
    if (EnvironmentConfig[env]) {
        EnvironmentConfig[env]();
    }
}

// Auto-validation on load
if (typeof console !== 'undefined') {
    const validation = ConfigUtils.validate();
    if (!validation.valid) {
        console.warn("Configuration validation failed:", validation.issues);
    }
}