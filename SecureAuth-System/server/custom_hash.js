// custom_hash.js - JavaScript version of custom_hash.hpp and custom_hash.cpp

// Hash128 structure
class Hash128 {
    constructor() {
        this.block1 = 0; // 32-bit
        this.block2 = 0; // 32-bit  
        this.block3 = 0; // 32-bit
        this.block4 = 0; // 32-bit
    }
}

// Server metadata structures
class UserMetadata {
    constructor() {
        this.username = "";
        this.createdTime = Math.floor(Date.now() / 1000);
        this.accessCount = 0;
    }
}

class AuthData {
    constructor() {
        this.loginAttempts = 0;
        this.lastLogin = Math.floor(Date.now() / 1000);
        this.failedAttempts = 0;
    }
}

class ContextData {
    constructor() {
        this.sessionId = 0;
        this.ipHash = 0;
        this.userAgentHash = 0;
    }
}

class VerificationData {
    constructor() {
        this.checksum = 0;
        this.integrityCheck = false;
        this.lastVerified = Math.floor(Date.now() / 1000);
    }
}

class RecoveryData {
    constructor() {
        this.backupSeed = 0;
        this.recoveryKey = 0;
        this.backupHash = 0;
    }
}

// Server structures
class ServerA {
    constructor() {
        this.hashFragment = 0;
        this.metadata = new UserMetadata();
    }
}

class ServerB {
    constructor() {
        this.hashFragment = 0;
        this.authData = new AuthData();
    }
}

class ServerC {
    constructor() {
        this.hashFragment = 0;
        this.contextData = new ContextData();
    }
}

class ServerD {
    constructor() {
        this.hashFragment = 0; // 16-bit
        this.verificationData = new VerificationData();
    }
}

class ServerE {
    constructor() {
        this.hashFragment = 0; // 16-bit
        this.recoveryData = new RecoveryData();
    }
}

class ServerHashData {
    constructor() {
        this.serverA = new ServerA();
        this.serverB = new ServerB();
        this.serverC = new ServerC();
        this.serverD = new ServerD();
        this.serverE = new ServerE();
    }
}

// Main CustomHash namespace
const CustomHash = {
    /**
     * Hash string function - basic hash implementation
     * @param {string} input - Input string to hash
     * @param {number} seed - Seed value for consistent results
     * @returns {number} 64-bit hash result (simulated with 32-bit)
     */
    hashString(input, seed) {
        let hash = seed >>> 0;
        
        // Simple hash algorithm (similar to C++ implementation)
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash ^= char;
            hash = (hash * 0x9e3779b1) >>> 0; // Golden ratio multiplier
            hash = ((hash << 13) | (hash >>> 19)) >>> 0; // Rotate left 13
            hash ^= (hash >>> 16);
        }
        
        // Final mixing
        hash ^= hash >>> 16;
        hash = (hash * 0x85ebca6b) >>> 0;
        hash ^= hash >>> 13;
        hash = (hash * 0xc2b2ae35) >>> 0;
        hash ^= hash >>> 16;
        
        return hash >>> 0;
    },

    /**
     * Split hash into multiple blocks
     * @param {string} input - Input string
     * @param {number} seed - Seed value
     * @param {number} numBlocks - Number of blocks to split into
     * @returns {Array<number>} Array of hash blocks
     */
    splitHashBlocks(input, seed, numBlocks) {
        const blocks = [];
        
        for (let i = 0; i < numBlocks; i++) {
            const blockSeed = (seed + i * 0x9e3779b9) >>> 0;
            const blockHash = this.hashString(input + i.toString(), blockSeed);
            blocks.push(blockHash);
        }
        
        return blocks;
    },

    /**
     * Generate 128-bit hash (4 blocks of 32-bit)
     * @param {string} username - Username
     * @param {string} password - Password
     * @param {number} seed - Seed value
     * @returns {Hash128} 128-bit hash structure
     */
    generateHash128(username, password, seed) {
        const combined = username + ":" + password;
        const blocks = this.splitHashBlocks(combined, seed, 4);
        
        const hash128 = new Hash128();
        hash128.block1 = blocks[0];
        hash128.block2 = blocks[1];
        hash128.block3 = blocks[2];
        hash128.block4 = blocks[3];
        
        return hash128;
    },

    /**
     * Split hash for 5-way server distribution
     * @param {string} username - Username
     * @param {string} password - Password
     * @param {number} seed - Seed value
     * @returns {ServerHashData} Server-distributed hash data
     */
    splitForServers(username, password, seed) {
        const hash128 = this.generateHash128(username, password, seed);
        const serverData = new ServerHashData();
        const now = Math.floor(Date.now() / 1000);
        
        // Server A - User metadata
        serverData.serverA.hashFragment = hash128.block1;
        serverData.serverA.metadata.username = username;
        serverData.serverA.metadata.createdTime = now;
        serverData.serverA.metadata.accessCount = 1;
        
        // Server B - Authentication data
        serverData.serverB.hashFragment = hash128.block2;
        serverData.serverB.authData.loginAttempts = 0;
        serverData.serverB.authData.lastLogin = now;
        serverData.serverB.authData.failedAttempts = 0;
        
        // Server C - Context data
        serverData.serverC.hashFragment = hash128.block3;
        serverData.serverC.contextData.sessionId = Math.floor(Math.random() * 0xFFFFFFFF);
        serverData.serverC.contextData.ipHash = this.hashString("192.168.1.1", seed);
        serverData.serverC.contextData.userAgentHash = this.hashString("Mozilla/5.0", seed);
        
        // Server D - Verification data (16-bit fragment)
        serverData.serverD.hashFragment = hash128.block4 & 0xFFFF;
        serverData.serverD.verificationData.checksum = (hash128.block1 ^ hash128.block2) & 0xFFFF;
        serverData.serverD.verificationData.integrityCheck = true;
        serverData.serverD.verificationData.lastVerified = now;
        
        // Server E - Recovery data (16-bit fragment)
        serverData.serverE.hashFragment = (hash128.block4 >>> 16) & 0xFFFF;
        serverData.serverE.recoveryData.backupSeed = seed >>> 0;
        serverData.serverE.recoveryData.recoveryKey = (hash128.block3 >>> 16) & 0xFFFF;
        serverData.serverE.recoveryData.backupHash = hash128.block1 & 0xFFFF;
        
        return serverData;
    },

    /**
     * Verify hash against stored data
     * @param {string} username - Username
     * @param {string} password - Password
     * @param {number} seed - Seed value
     * @param {ServerHashData} storedData - Stored server data
     * @returns {boolean} Verification result
     */
    verifyHash(username, password, seed, storedData) {
        const newData = this.splitForServers(username, password, seed);
        
        return (
            newData.serverA.hashFragment === storedData.serverA.hashFragment &&
            newData.serverB.hashFragment === storedData.serverB.hashFragment &&
            newData.serverC.hashFragment === storedData.serverC.hashFragment &&
            newData.serverD.hashFragment === storedData.serverD.hashFragment &&
            newData.serverE.hashFragment === storedData.serverE.hashFragment
        );
    },

    /**
     * Print hash information for debugging
     * @param {Hash128} hash128 - 128-bit hash structure
     */
    printHashInfo(hash128) {
        console.log("=== Hash128 Information ===");
        console.log(`Block 1: 0x${hash128.block1.toString(16).padStart(8, '0')}`);
        console.log(`Block 2: 0x${hash128.block2.toString(16).padStart(8, '0')}`);
        console.log(`Block 3: 0x${hash128.block3.toString(16).padStart(8, '0')}`);
        console.log(`Block 4: 0x${hash128.block4.toString(16).padStart(8, '0')}`);
    },

    /**
     * Print server distribution information
     * @param {ServerHashData} data - Server hash data
     */
    printServerDistribution(data) {
        console.log("=== Server Distribution ===");
        console.log(`Server A: 0x${data.serverA.hashFragment.toString(16)} (${data.serverA.metadata.username})`);
        console.log(`Server B: 0x${data.serverB.hashFragment.toString(16)} (Auth)`);
        console.log(`Server C: 0x${data.serverC.hashFragment.toString(16)} (Context)`);
        console.log(`Server D: 0x${data.serverD.hashFragment.toString(16)} (Verification)`);
        console.log(`Server E: 0x${data.serverE.hashFragment.toString(16)} (Recovery)`);
    },

    /**
     * Performance test
     * @param {number} numTests - Number of tests to run (default: 1000)
     */
    performanceTest(numTests = 1000) {
        console.log(`Starting performance test with ${numTests} iterations...`);
        const startTime = performance.now();
        
        for (let i = 0; i < numTests; i++) {
            const username = `user${i}`;
            const password = `pass${i}`;
            const seed = i + 12345;
            this.splitForServers(username, password, seed);
        }
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const avgTime = totalTime / numTests;
        
        console.log("=== Performance Test Results ===");
        console.log(`Total time: ${totalTime.toFixed(2)}ms`);
        console.log(`Average time per operation: ${avgTime.toFixed(4)}ms`);
        console.log(`Operations per second: ${(numTests / (totalTime / 1000)).toFixed(0)}`);
    },

    /**
     * Security strength test
     */
    securityStrengthTest() {
        console.log("=== Security Strength Test ===");
        
        // Test collision resistance
        const testSet = new Set();
        const iterations = 10000;
        let collisions = 0;
        
        for (let i = 0; i < iterations; i++) {
            const input = `test${i}`;
            const hash = this.hashString(input, 12345);
            
            if (testSet.has(hash)) {
                collisions++;
            } else {
                testSet.add(hash);
            }
        }
        
        console.log(`Collision test: ${collisions} collisions in ${iterations} hashes`);
        console.log(`Collision rate: ${(collisions / iterations * 100).toFixed(4)}%`);
        
        // Test distribution
        const buckets = new Array(256).fill(0);
        for (let i = 0; i < 10000; i++) {
            const hash = this.hashString(`test${i}`, 12345);
            buckets[hash & 0xFF]++;
        }
        
        const expected = 10000 / 256;
        const chiSquare = buckets.reduce((sum, observed) => {
            return sum + Math.pow(observed - expected, 2) / expected;
        }, 0);
        
        console.log(`Distribution test (Chi-square): ${chiSquare.toFixed(2)}`);
        console.log("Lower values indicate better distribution");
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CustomHash, Hash128, ServerHashData };
}