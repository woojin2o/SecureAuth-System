// 회원가입 처리 (수정된 부분)
async function handleSignup() {
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
    
    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('signup-hash').textContent = result.hash;
            document.getElementById('signup-result').style.display = 'block';
            showUserStatus(result.message + ' 🎉', 'success');
            
            // 서버 상태 업데이트
            Object.keys(serverStatus).forEach(server => {
                serverStatus[server] = true;
            });
        } else {
            showUserStatus(result.message, 'error');
        }
    } catch (error) {
        showUserStatus('서버 연결 오류가 발생했습니다.', 'error');
        console.error('Signup error:', error);
    }
    
    // 입력 필드 초기화
    document.getElementById('signup-username').value = '';
    document.getElementById('signup-password').value = '';
    document.getElementById('signup-confirm').value = '';
}

// 로그인 처리 (수정된 부분)
async function handleLogin() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        showLoginResult('사용자 ID와 패스워드를 모두 입력해주세요.', false);
        return;
    }
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showLoginResult(result.message + ' 🎊', true);
        } else {
            showLoginResult(result.message + ' 🚫', false);
        }
    } catch (error) {
        showLoginResult('서버 연결 오류가 발생했습니다.', false);
        console.error('Login error:', error);
    }
    
    document.getElementById('login-password').value = '';
}

// 서버 상태 새로고침 (수정된 부분)
async function refreshServers() {
    showAdminStatus('서버 상태를 새로고침하고 있습니다...', 'success');
    
    try {
        const response = await fetch('/api/server-status');
        const data = await response.json();
        
        // userData 업데이트
        userData = data.userData;
        serverStatus = data.status;
        
        updateServerDisplay();
        updateUserList();
        showAdminStatus(`모든 서버 상태가 업데이트되었습니다. (사용자: ${data.userCount}명)`, 'success');
    } catch (error) {
        showAdminStatus('서버 상태 새로고침 중 오류가 발생했습니다.', 'error');
        console.error('Refresh error:', error);
    }
}
