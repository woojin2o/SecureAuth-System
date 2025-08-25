// public/script.js - 메인 JavaScript 파일

// 글로벌 변수들
let userData = {};
let serverStatus = {
    A: false, B: false, C: false, D: false, E: false
};

// ChaoticRNG 클래스 - rand.hpp의 ChaoticRNG를 JavaScript로 구현
class ChaoticRNG {
    constructor(seed, key = 314159, r = 3.99) {
        this.x = (seed % 4294967295) / 4294967295.0;
        this.k = (key % 4294967295) / 4294967295.0;
        this.r = r;
        this.i = 0;
        this.keyMod = key % 101;
    }
    
    next() {
        // Chaotic step
        this.x = this.r * this.x * (1.0 - this.x);
        
        // Nonlinear mixing
        let y = (this.x + this.k + ((this.i % 251) / 997.0)) % 1.0;
        
        // Scale to 64-bit integer
        let val = Math.floor(y * (Math.pow(2, 53) - 1));
        
        // State update
        this.x = (this.x + y + this.keyMod) % 1.0;
        this.i++;
        return val;
    }
}

// 해시 함수들
function customHash(input, seed) {
    let rng = new ChaoticRNG(seed);
    let hash = 0;
    
    for (let i = 0; i < input.length; i++) {
        let char = input.charCodeAt(i);
        hash = (hash + char * rng.next()) % (Math.pow(2, 53) - 1);
    }
    
    // 추가 혼합을 위한 여러 라운드
    for (let round = 0; round < 5; round++) {
        hash = (hash * rng.next()) % (Math.pow(2, 53) - 1);
    }
    
    return hash;
}

function generateAdvancedHash(username, password) {
    // 사용자명과 패스워드를 조합하여 시드 생성
    let seedStr = username + ":" + password;
    let seed = 0;
    
    for (let i = 0; i < seedStr.length; i++) {
        seed = ((seed << 5) - seed + seedStr.charCodeAt(i)) & 0xffffffff;
    }
    
    // 128비트 해시 생성 (4개의 32비트 블록)
    let hash1 = customHash(password + username, seed);
    let hash2 = customHash(username + password, seed ^ 0xABCDEF);
    let hash3 = customHash(password + "salt1" + username, seed ^ 0x123456);
    let hash4 = customHash(username + "salt2" + password, seed ^ 0x789ABC);
    
    return {
        block1: (hash1 % Math.pow(2, 32)).toString(16).padStart(8, '0'),
        block2: (hash2 % Math.pow(2, 32)).toString(16).padStart(8, '0'),
        block3: (hash3 % Math.pow(2, 32)).toString(16).padStart(8, '0'),
        block4: (hash4 % Math.pow(2, 32)).toString(16).padStart(8, '0')
    };
}

function splitHash(hashBlocks, username) {
    const now = new Date().toISOString();
    
    return {
        serverA: {
            hashFragment: hashBlocks.block1,
            metadata: {
                username: username,
                created: now,
                lastAccess: now,
                userLevel: "standard"
            }
        },
        serverB: {
            hashFragment: hashBlocks.block2,
            authHistory: {
                loginCount: 0,
                lastLogin: null,
                failedAttempts: 0,
                loginHistory: []
            }
        },
        serverC: {
            hashFragment: hashBlocks.block3,
            context: {
                ipAddress: "192.168.1." + Math.floor(Math.random() * 255),
                userAgent: "SecureSystem/2.0",
                sessionId: Math.random().toString(36).substr(2, 12),
                location: "Seoul, KR"
            }
        },
        serverD: {
            hashFragment: hashBlocks.block4.substr(0, 4), // 16비트
            verification: {
                checksum: hashBlocks.block4.substr(4, 4),
                integrity: true,
                lastVerified: now
            }
        },
        serverE: {
            hashFragment: hashBlocks.block4.substr(4, 4), // 16비트
            recovery: {
                seed: Math.random().toString(36).substr(2, 10),
                backupHash: hashBlocks.block1.substr(0, 4),
                recoveryKey: Math.random().toString(36).substr(2, 8)
            }
        }
    };
}

// UI 함수들
function showPage(pageId) {
    // 네비게이션 업데이트
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    if (pageId === 'user-site') {
        document.getElementById('nav-user-site').classList.add('active');
    } else {
        document.getElementById('nav-server-admin').classList.add('active');
    }
    
    // 페이지 업데이트
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    
    // 서버 관리 페이지로 전환시 상태 업데이트
    if (pageId === 'server-admin') {
        updateServerDisplay();
        updateUserList();
    }
}

function switchAuthTab(tabName) {
    // 탭 버튼 업데이트
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    if (tabName === 'signup') {
        document.getElementById('tab-signup').classList.add('active');
    } else {
        document.getElementById('tab-login').classList.add('active');
    }
    
    // 탭 콘텐츠 업데이트
    document.querySelectorAll('.auth-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-content`).classList.add('active');
    
    // 결과 메시지 초기화
    document.getElementById('signup-result').style.display = 'none';
    document.getElementById('login-result').innerHTML = '';
    document.getElementById('user-status').style.display = 'none';
}

// 회원가입 처리
function handleSignup() {
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    
    if (!username || !password || !confirm) {
        showUserStatus('모든 필드를 입력해주세요.', 'error');
        return;
    }
    
    if (password !== confirm) {
        showUserStatus('패스워드가 일치하지 않습니다.', 'error');
        return;
    }
    
    if (userData[username]) {
        showUserStatus('이미 존재하는 사용자 ID입니다.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showUserStatus('패스워드는 6자 이상이어야 합니다.', 'error');
        return;
    }
    
    // 해시 생성 및 분할
    const hashBlocks = generateAdvancedHash(username, password);
    const fullHash = hashBlocks.block1 + hashBlocks.block2 + hashBlocks.block3 + hashBlocks.block4;
    const splitData = splitHash(hashBlocks, username);
    
    userData[username] = splitData;
    
    // 서버 상태 활성화
    Object.keys(serverStatus).forEach(server => {
        serverStatus[server] = true;
    });
    
    // UI 업데이트
    document.getElementById('signup-hash').textContent = fullHash;
    document.getElementById('signup-result').style.display = 'block';
    showUserStatus('회원가입이 완료되었습니다! 🎉', 'success');
    
    // 입력 필드 초기화
    document.getElementById('signup-username').value = '';
    document.getElementById('signup-password').value = '';
    document.getElementById('signup-confirm').value = '';
}

// 로그인 처리
function handleLogin() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        showLoginResult('사용자 ID와 패스워드를 모두 입력해주세요.', false);
        return;
    }
    
    if (!userData[username]) {
        showLoginResult('존재하지 않는 사용자 ID입니다.', false);
        return;
    }
    
    // 입력된 패스워드로 해시 재생성
    const hashBlocks = generateAdvancedHash(username, password);
    const storedData = userData[username];
    
    // 각 서버의 데이터와 비교
    let isValid = true;
    isValid &= storedData.serverA.hashFragment === hashBlocks.block1;
    isValid &= storedData.serverB.hashFragment === hashBlocks.block2;
    isValid &= storedData.serverC.hashFragment === hashBlocks.block3;
    isValid &= storedData.serverD.hashFragment === hashBlocks.block4.substr(0, 4);
    isValid &= storedData.serverE.hashFragment === hashBlocks.block4.substr(4, 4);
    
    if (isValid) {
        // 로그인 성공 - 메타데이터 업데이트
        storedData.serverB.authHistory.loginCount++;
        storedData.serverB.authHistory.lastLogin = new Date().toISOString();
        storedData.serverB.authHistory.failedAttempts = 0;
        storedData.serverB.authHistory.loginHistory.push({
            timestamp: new Date().toISOString(),
            success: true,
            ip: storedData.serverC.context.ipAddress
        });
        storedData.serverA.metadata.lastAccess = new Date().toISOString();
        
        showLoginResult(`환영합니다, ${username}님! 🎊<br>모든 서버에서 인증이 완료되었습니다.`, true);
    } else {
        // 로그인 실패
        storedData.serverB.authHistory.failedAttempts++;
        storedData.serverB.authHistory.loginHistory.push({
            timestamp: new Date().toISOString(),
            success: false,
            ip: storedData.serverC.context.ipAddress
        });
        
        showLoginResult('로그인 실패! 패스워드가 올바르지 않습니다. 🚫', false);
    }
    
    document.getElementById('login-password').value = '';
}

// 서버 상태 업데이트
function updateServerDisplay() {
    const servers = ['A', 'B', 'C', 'D', 'E'];
    
    servers.forEach(server => {
        const serverCard = document.getElementById(`server-${server}`);
        const statusElement = document.getElementById(`status-${server}`);
        const dataElement = document.getElementById(`data-${server}`);
        
        if (serverStatus[server]) {
            serverCard.classList.add('active');
            serverCard.classList.remove('error');
            statusElement.textContent = 'ONLINE';
            statusElement.className = 'server-status status-online';
            
            // 서버별 데이터 표시
            const serverKey = `server${server}`;
            let serverData = [];
            
            Object.values(userData).forEach(user => {
                if (user[serverKey]) {
                    serverData.push({
                        user: user.serverA?.metadata?.username || 'unknown',
                        data: user[serverKey]
                    });
                }
            });
            
            if (serverData.length > 0) {
                dataElement.innerHTML = serverData.map(item => 
                    `<div style="margin-bottom: 10px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 5px;">
                        <strong>User: ${item.user}</strong><br>
                        ${JSON.stringify(item.data, null, 2)}
                    </div>`
                ).join('');
            } else {
                dataElement.textContent = '저장된 데이터가 없습니다.';
            }
        } else {
            serverCard.classList.remove('active');
            statusElement.textContent = 'OFFLINE';
            statusElement.className = 'server-status status-offline';
            dataElement.textContent = '서버 대기 중...';
        }
    });
}

// 사용자 목록 업데이트
function updateUserList() {
    const userListContent = document.getElementById('user-list-content');
    
    if (Object.keys(userData).length === 0) {
        userListContent.innerHTML = '등록된 사용자가 없습니다.';
        return;
    }
    
    const userItems = Object.entries(userData).map(([username, data]) => {
        const metadata = data.serverA?.metadata || {};
        const authHistory = data.serverB?.authHistory || {};
        
        return `
            <div class="user-item">
                <div>
                    <strong>${username}</strong><br>
                    <small>생성: ${new Date(metadata.created).toLocaleString('ko-KR')}</small><br>
                    <small>최근 접속: ${metadata.lastAccess ? new Date(metadata.lastAccess).toLocaleString('ko-KR') : '없음'}</small>
                </div>
                <div style="text-align: right;">
                    <div>로그인 횟수: ${authHistory.loginCount || 0}</div>
                    <div>실패 횟수: ${authHistory.failedAttempts || 0}</div>
                </div>
            </div>
        `;
    }).join('');
    
    userListContent.innerHTML = userItems;
}

// 서버 관리 기능들
function refreshServers() {
    showAdminStatus('서버 상태를 새로고침하고 있습니다...', 'success');
    
    setTimeout(() => {
        updateServerDisplay();
        updateUserList();
        showAdminStatus('모든 서버 상태가 업데이트되었습니다.', 'success');
    }, 1000);
}

function syncServers() {
    showAdminStatus('서버 간 데이터 동기화를 시작합니다...', 'success');
    
    setTimeout(() => {
        let syncCount = 0;
        Object.keys(userData).forEach(username => {
            syncCount++;
        });
        
        showAdminStatus(`${syncCount}개 계정의 데이터 동기화가 완료되었습니다.`, 'success');
    }, 1500);
}

function clearAllData() {
    if (confirm('⚠️ 정말로 모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
        userData = {};
        Object.keys(serverStatus).forEach(server => {
            serverStatus[server] = false;
        });
        
        updateServerDisplay();
        updateUserList();
        showAdminStatus('모든 데이터가 삭제되었습니다.', 'error');
        
        // 사용자 사이트의 결과도 초기화
        document.getElementById('signup-result').style.display = 'none';
        document.getElementById('login-result').innerHTML = '';
    }
}

// 상태 메시지 표시 함수들
function showUserStatus(message, type) {
    const statusElement = document.getElementById('user-status');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    statusElement.style.display = 'block';
    
    setTimeout(() => {
        statusElement.style.display = 'none';
    }, 4000);
}

function showLoginResult(message, success) {
    const resultElement = document.getElementById('login-result');
    resultElement.innerHTML = `
        <div class="status-message ${success ? 'success' : 'error'}" style="margin-top: 15px;">
            ${message}
        </div>
    `;
}

function showAdminStatus(message, type) {
    const statusElement = document.getElementById('admin-status');
    statusElement.innerHTML = `
        <div class="status-message ${type}">
            ${message}
        </div>
    `;
    
    setTimeout(() => {
        statusElement.innerHTML = '';
    }, 3000);
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 네비게이션
    document.getElementById('nav-user-site').addEventListener('click', () => showPage('user-site'));
    document.getElementById('nav-server-admin').addEventListener('click', () => showPage('server-admin'));
    
    // 인증 탭
    document.getElementById('tab-signup').addEventListener('click', () => switchAuthTab('signup'));
    document.getElementById('tab-login').addEventListener('click', () => switchAuthTab('login'));
    
    // 회원가입/로그인 버튼
    document.getElementById('signup-btn').addEventListener('click', handleSignup);
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    
    // 서버 관리 버튼
    document.getElementById('refresh-btn').addEventListener('click', refreshServers);
    document.getElementById('sync-btn').addEventListener('click', syncServers);
    document.getElementById('clear-btn').addEventListener('click', clearAllData);
    
    // Enter 키 이벤트
    const signupPassword = document.getElementById('signup-password');
    const signupConfirm = document.getElementById('signup-confirm');
    const loginPassword = document.getElementById('login-password');
    
    if (signupPassword) {
        signupPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const confirmField = document.getElementById('signup-confirm');
                if (confirmField) confirmField.focus();
            }
        });
    }
    
    if (signupConfirm) {
        signupConfirm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleSignup();
        });
    }
    
    if (loginPassword) {
        loginPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
    }
}

// 초기화 함수
function initializeSystem() {
    setupEventListeners();
    showAdminStatus('분산 패스워드 보안 시스템이 준비되었습니다. 🚀', 'success');
    
    console.log('SecureAuth System initialized');
    console.log('ChaoticRNG hash algorithm loaded');
    console.log('5-Way split server architecture ready');
}

// DOM 로드 완료 후 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
} else {
    initializeSystem();
}