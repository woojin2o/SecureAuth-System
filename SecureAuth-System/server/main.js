// main.js - JavaScript version of the main() function from custom_hash.cpp
// This simulates the original C++ console application behavior

/**
 * Main function - equivalent to the C++ main() function
 * Provides interactive hash testing interface
 */
function main() {
    console.log("=== Custom Hash Interactive Test ===");
    console.log("JavaScript version of C++ custom_hash.cpp");
    console.log("");

    // Simulate the C++ input behavior
    let seed = null;
    let input = "";

    // Get seed input (simulating std::cin >> seed)
    while (seed === null) {
        const seedInput = prompt("시드 입력:");
        if (seedInput === null) {
            console.log("프로그램을 종료합니다.");
            return;
        }
        
        const parsedSeed = parseInt(seedInput);
        if (!isNaN(parsedSeed)) {
            seed = parsedSeed;
        } else {
            alert("올바른 숫자를 입력해주세요.");
        }
    }

    console.log(`시드 값: ${seed}`);
    console.log("문자열을 입력하세요 (취소 버튼을 눌러 종료):");

    // Main input loop (simulating std::getline until EOF)
    while (true) {
        input = prompt("해시할 문자열을 입력하세요:");
        
        // Break on cancel (simulating Ctrl+D/Ctrl+Z)
        if (input === null) {
            console.log("프로그램을 종료합니다.");
            break;
        }

        // Process the input
        if (input.trim() !== "") {
            const hash = CustomHash.hashString(input, seed);
            console.log(`  > 0x${hash.toString(16)} (${hash})`);
        }
    }
}

/**
 * Browser-friendly version with HTML interface
 */
function createInteractiveInterface() {
    // Check if we're in a browser environment
    if (typeof document === 'undefined') {
        console.log("This function requires a browser environment");
        return;
    }

    const container = document.createElement('div');
    container.id = 'hash-tester';
    container.innerHTML = `
        <div style="
            max-width: 600px; 
            margin: 20px auto; 
            padding: 20px; 
            border: 1px solid #ccc; 
            border-radius: 10px;
            font-family: Arial, sans-serif;
            background: #f9f9f9;
        ">
            <h2>🔐 Custom Hash Tester</h2>
            <p>JavaScript version of C++ custom_hash.cpp</p>
            
            <div style="margin-bottom: 15px;">
                <label for="seed-input">시드 입력:</label><br>
                <input type="number" id="seed-input" placeholder="예: 12345" style="
                    width: 100%; 
                    padding: 8px; 
                    margin-top: 5px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                ">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label for="string-input">해시할 문자열:</label><br>
                <input type="text" id="string-input" placeholder="해시할 문자열을 입력하세요" style="
                    width: 100%; 
                    padding: 8px; 
                    margin-top: 5px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                ">
            </div>
            
            <button id="hash-button" style="
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                margin-right: 10px;
            ">해시 계산</button>
            
            <button id="clear-button" style="
                background: #6c757d;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
            ">결과 지우기</button>
            
            <div id="results" style="
                margin-top: 20px;
                padding: 15px;
                background: #e9ecef;
                border-radius: 4px;
                font-family: monospace;
                min-height: 100px;
                max-height: 300px;
                overflow-y: auto;
            ">
                <p style="margin: 0; color: #666;">결과가 여기에 표시됩니다...</p>
            </div>
        </div>
    `;

    // Add to page if body exists, otherwise log instructions
    if (document.body) {
        document.body.appendChild(container);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(container);
        });
    }

    // Add event listeners
    setTimeout(() => {
        const seedInput = document.getElementById('seed-input');
        const stringInput = document.getElementById('string-input');
        const hashButton = document.getElementById('hash-button');
        const clearButton = document.getElementById('clear-button');
        const results = document.getElementById('results');

        // Set default seed
        seedInput.value = '12345';

        function addResult(text) {
            const p = document.createElement('p');
            p.textContent = text;
            p.style.margin = '5px 0';
            results.appendChild(p);
            results.scrollTop = results.scrollHeight;
        }

        function clearResults() {
            results.innerHTML = '<p style="margin: 0; color: #666;">결과가 여기에 표시됩니다...</p>';
        }

        hashButton.addEventListener('click', () => {
            const seed = parseInt(seedInput.value);
            const input = stringInput.value;

            if (isNaN(seed)) {
                alert('올바른 시드 값을 입력해주세요.');
                return;
            }

            if (input.trim() === '') {
                alert('해시할 문자열을 입력해주세요.');
                return;
            }

            try {
                const hash = CustomHash.hashString(input, seed);
                addResult(`입력: "${input}" → 0x${hash.toString(16)} (${hash})`);
                
                // Clear input for next entry
                stringInput.value = '';
                stringInput.focus();
            } catch (error) {
                addResult(`에러: ${error.message}`);
            }
        });

        clearButton.addEventListener('click', clearResults);

        // Enter key support
        stringInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                hashButton.click();
            }
        });

        seedInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                stringInput.focus();
            }
        });

        // Focus on string input initially
        stringInput.focus();
    }, 100);
}

/**
 * Command-line style version for Node.js
 */
function nodeMain() {
    const readline = require('readline');
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log("=== Custom Hash Interactive Test (Node.js) ===");
    
    rl.question('시드 입력: ', (seedInput) => {
        const seed = parseInt(seedInput);
        
        if (isNaN(seed)) {
            console.log('올바른 숫자를 입력해주세요.');
            rl.close();
            return;
        }

        console.log('문자열을 입력하세요 (Ctrl+D로 종료):');
        
        rl.on('line', (input) => {
            try {
                const hash = CustomHash.hashString(input, seed);
                console.log(`  > 0x${hash.toString(16)} (${hash})`);
            } catch (error) {
                console.log(`에러: ${error.message}`);
            }
        });

        rl.on('close', () => {
            console.log('\n프로그램을 종료합니다.');
            process.exit(0);
        });
    });
}

/**
 * Batch testing function
 */
function batchTest() {
    console.log("=== Batch Test Mode ===");
    
    const testCases = [
        { input: "hello", seed: 12345 },
        { input: "world", seed: 12345 },
        { input: "test", seed: 54321 },
        { input: "password123", seed: 98765 },
        { input: "SecureAuth", seed: 11111 },
        { input: "", seed: 12345 }, // Empty string test
        { input: "a", seed: 12345 }, // Single character
        { input: "The quick brown fox jumps over the lazy dog", seed: 12345 } // Long string
    ];

    console.log("Testing multiple inputs:");
    console.log("Input".padEnd(50) + "Seed".padEnd(10) + "Hash");
    console.log("-".repeat(80));

    testCases.forEach(({ input, seed }) => {
        try {
            const hash = CustomHash.hashString(input, seed);
            const inputDisplay = input === "" ? "(empty)" : input;
            const truncatedInput = inputDisplay.length > 45 ? inputDisplay.substr(0, 42) + "..." : inputDisplay;
            
            console.log(
                truncatedInput.padEnd(50) + 
                seed.toString().padEnd(10) + 
                `0x${hash.toString(16)} (${hash})`
            );
        } catch (error) {
            console.log(`Error with "${input}": ${error.message}`);
        }
    });
}

// === Environment Detection and Auto-execution ===

if (typeof window !== 'undefined') {
    // Browser environment
    window.hashMain = main;
    window.createInteractiveInterface = createInteractiveInterface;
    window.batchTest = batchTest;
    
    // Auto-create interface if CustomHash is available
    if (typeof CustomHash !== 'undefined') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log("Creating interactive hash interface...");
            createInteractiveInterface();
        });
    }
    
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        main,
        nodeMain,
        batchTest,
        createInteractiveInterface
    };
    
    // Auto-run if executed directly
    if (require.main === module) {
        // Check if CustomHash is available
        try {
            const { CustomHash } = require('./custom_hash.js');
            global.CustomHash = CustomHash;
            nodeMain();
        } catch (error) {
            console.log("CustomHash module not found. Running batch test instead.");
            batchTest();
        }
    }
}