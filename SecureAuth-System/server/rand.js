// rand.js - JavaScript version of rand.hpp

// === ChaoticRNG Implementation ===
class ChaoticRNG {
    constructor(seed, key = 314159, rVal = 3.99) {
        this.r = rVal;
        this.i = 0;
        this.x = (seed % 4294967295) / 4294967295.0;
        this.k = (key % 4294967295) / 4294967295.0;
        this.keyMod = key % 101;
    }

    next() {
        // 1. Chaotic step - logistic map
        this.x = this.r * this.x * (1.0 - this.x);

        // 2. Nonlinear mixing
        let y = (this.x + this.k + ((this.i % 251) / 997.0)) % 1.0;
        if (y < 0) y += 1.0; // Ensure positive

        // 3. Scale to 64-bit integer (JavaScript uses 32-bit for bitwise ops)
        const val = Math.floor(y * 0xFFFFFFFF) >>> 0;

        // 4. State update
        this.x = (this.x + y + this.keyMod) % 1.0;
        if (this.x < 0) this.x += 1.0; // Ensure positive
        this.i++;
        
        return val;
    }
}

// === SlightlyHardRNG Implementation ===

// Helper functions
function mix32(x) {
    x = x >>> 0; // Ensure unsigned 32-bit
    x ^= x >>> 16; 
    x = (x * 0x7feb352d) >>> 0;
    x ^= x >>> 15; 
    x = (x * 0x846ca68b) >>> 0;
    x ^= x >>> 16;
    return x >>> 0;
}

function rotl64(x, r) {
    // JavaScript doesn't have true 64-bit integers, simulate with 32-bit
    return ((x << r) | (x >>> (32 - r))) >>> 0;
}

function rotl32(x, r) {
    return ((x << r) | (x >>> (32 - r))) >>> 0;
}

// Feistel3 structure
class Feistel3 {
    constructor(k0, k1, pepper) {
        this.k0 = k0 >>> 0;
        this.k1 = k1 >>> 0;
        this.pepper = pepper >>> 0;
    }

    static F(x, k, p) {
        x = (x ^ k) >>> 0;
        x = (x * 0x9E3779B1) >>> 0;
        x = rotl32(x, 13);
        x = (x ^ (x + p)) >>> 0;
        return rotl32(x, p & 31);
    }

    permute(v) {
        let L = v & 0xFFFFFFFF;
        let R = (v >>> 16) & 0xFFFF; // Simulate high 32 bits
        
        // Round 1
        let t = Feistel3.F(R, this.k0, this.pepper);
        L ^= t;
        [L, R] = [R, L];

        // Round 2
        t = Feistel3.F(R, this.k1, this.pepper ^ 0xA5A5A5A5);
        L ^= t;
        [L, R] = [R, L];

        // Round 3
        t = Feistel3.F(R, this.k0 ^ this.k1, rotl32(this.pepper, 7));
        L ^= t;

        return ((R << 16) | L) >>> 0;
    }
}

function splitmix64(x) {
    x = (x + 0x9E3779B9) >>> 0; // Simplified to 32-bit
    x = ((x ^ (x >>> 30)) * 0xbf58476d) >>> 0;
    x = ((x ^ (x >>> 27)) * 0x94d049bb) >>> 0;
    x ^= x >>> 31;
    return x >>> 0;
}

class SlightlyHardRNG {
    constructor(seed, workBits = 26) {
        this.ctr = splitmix64(seed);
        
        const s0 = splitmix64(seed ^ 0xD1B54A32);
        const s1 = splitmix64(seed ^ 0x94D049BB);
        
        const k0 = mix32(s0 & 0xFFFFFFFF);
        const k1 = mix32((s0 >>> 16) & 0xFFFF);
        
        const mask = (workBits >= 32) ? 0xFFFFFFFF : ((1 << workBits) - 1);
        let pepper = mix32(s1 & 0xFFFFFFFF) & mask;
        if (pepper === 0) pepper = 1;
        
        this.f = new Feistel3(k0, k1, pepper);
    }

    next() {
        this.ctr = (this.ctr + 0x9E3779B9) >>> 0;
        return this.f.permute(this.ctr);
    }
}

// === Namespace exports ===
const ChaoticRNG_NS = {
    ChaoticRNG
};

const SlightlyHardRNG_NS = {
    mix32,
    rotl64,
    rotl32,
    Feistel3,
    splitmix64,
    SlightlyHardRNG
};

// === Testing and Demo Functions ===
function testChaoticRNG() {
    console.log("=== ChaoticRNG Test ===");
    const rng = new ChaoticRNG(12345);
    
    console.log("First 10 numbers:");
    for (let i = 0; i < 10; i++) {
        const val = rng.next();
        console.log(`${i + 1}: 0x${val.toString(16).padStart(8, '0')} (${val})`);
    }
    
    // Test reproducibility
    const rng2 = new ChaoticRNG(12345);
    const first1 = rng2.next();
    const rng3 = new ChaoticRNG(12345);
    const first2 = rng3.next();
    
    console.log(`Reproducibility test: ${first1 === first2 ? 'PASS' : 'FAIL'}`);
}

function testSlightlyHardRNG() {
    console.log("=== SlightlyHardRNG Test ===");
    const rng = new SlightlyHardRNG(12345);
    
    console.log("First 10 numbers:");
    for (let i = 0; i < 10; i++) {
        const val = rng.next();
        console.log(`${i + 1}: 0x${val.toString(16).padStart(8, '0')} (${val})`);
    }
    
    // Test reproducibility
    const rng2 = new SlightlyHardRNG(12345);
    const first1 = rng2.next();
    const rng3 = new SlightlyHardRNG(12345);
    const first2 = rng3.next();
    
    console.log(`Reproducibility test: ${first1 === first2 ? 'PASS' : 'FAIL'}`);
}

function performanceTestRNG() {
    console.log("=== RNG Performance Test ===");
    const iterations = 1000000;
    
    // Test ChaoticRNG
    let start = performance.now();
    const chaotic = new ChaoticRNG(12345);
    for (let i = 0; i < iterations; i++) {
        chaotic.next();
    }
    let end = performance.now();
    console.log(`ChaoticRNG: ${end - start:.2f}ms for ${iterations} numbers`);
    console.log(`ChaoticRNG: ${(iterations / (end - start) * 1000).toFixed(0)} numbers/second`);
    
    // Test SlightlyHardRNG
    start = performance.now();
    const hard = new SlightlyHardRNG(12345);
    for (let i = 0; i < iterations; i++) {
        hard.next();
    }
    end = performance.now();
    console.log(`SlightlyHardRNG: ${end - start:.2f}ms for ${iterations} numbers`);
    console.log(`SlightlyHardRNG: ${(iterations / (end - start) * 1000).toFixed(0)} numbers/second`);
}

function statisticalTest() {
    console.log("=== Statistical Test ===");
    const iterations = 100000;
    
    // Test both RNGs for uniform distribution
    function testUniformity(rng, name) {
        const buckets = new Array(256).fill(0);
        
        for (let i = 0; i < iterations; i++) {
            const val = rng.next();
            buckets[val & 0xFF]++;
        }
        
        const expected = iterations / 256;
        const chiSquare = buckets.reduce((sum, observed) => {
            return sum + Math.pow(observed - expected, 2) / expected;
        }, 0);
        
        console.log(`${name} uniformity (Chi-square): ${chiSquare.toFixed(2)}`);
        console.log(`${name} expected ~255, lower is better`);
    }
    
    testUniformity(new ChaoticRNG(12345), "ChaoticRNG");
    testUniformity(new SlightlyHardRNG(54321), "SlightlyHardRNG");
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ChaoticRNG,
        SlightlyHardRNG,
        ChaoticRNG_NS,
        SlightlyHardRNG_NS,
        testChaoticRNG,
        testSlightlyHardRNG,
        performanceTestRNG,
        statisticalTest
    };
}

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined') {
    // Browser environment
    window.ChaoticRNG = ChaoticRNG;
    window.SlightlyHardRNG = SlightlyHardRNG;
    window.testChaoticRNG = testChaoticRNG;
    window.testSlightlyHardRNG = testSlightlyHardRNG;
    window.performanceTestRNG = performanceTestRNG;
    window.statisticalTest = statisticalTest;
}