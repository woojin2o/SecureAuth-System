from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import json
import math
import random
import string
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# 메모리 데이터베이스
user_data = {}
server_status = {
    'A': True, 'B': True, 'C': True, 'D': True, 'E': True
}

# ChaoticRNG 클래스 (rand.hpp를 Python으로 구현)
class ChaoticRNG:
    def __init__(self, seed, key=314159, r_val=3.99):
        self.x = (seed % 4294967295) / 4294967295.0
        self.k = (key % 4294967295) / 4294967295.0
        self.r = r_val
        self.i = 0
        self.key_mod = key % 101
    
    def next(self):
        # Chaotic step
        self.x = self.r * self.x * (1.0 - self.x)
        
        # Nonlinear mixing
        y = (self.x + self.k + ((self.i % 251) / 997.0)) % 1.0
        
        # Scale to integer
        val = int(y * ((1 << 53) - 1))
        
        # State update
        self.x = (self.x + y + self.key_mod) % 1.0
        self.i += 1
        return val

# 해시 함수들
def custom_hash(input_str, seed):
    rng = ChaoticRNG(seed)
    hash_val = 0
    
    for char in input_str:
        hash_val = (hash_val + ord(char) * rng.next()) % ((1 << 53) - 1)
    
    # Additional mixing rounds
    for _ in range(5):
        hash_val = (hash_val * rng.next()) % ((1 << 53) - 1)
    
    return hash_val

def generate_advanced_hash(username, password):
    seed_str = f"{username}:{password}"
    seed = 0
    
    for char in seed_str:
        seed = ((seed << 5) - seed + ord(char)) & 0xffffffff
    
    # Generate 4 blocks of 32-bit hashes
    hash1 = custom_hash(password + username, seed)
    hash2 = custom_hash(username + password, seed ^ 0xABCDEF)
    hash3 = custom_hash(password + "salt1" + username, seed ^ 0x123456)
    hash4 = custom_hash(username + "salt2" + password, seed ^ 0x789ABC)
    
    return {
        'block1': f"{hash1 % (1 << 32):08x}",
        'block2': f"{hash2 % (1 << 32):08x}",
        'block3': f"{hash3 % (1 << 32):08x}",
        'block4': f"{hash4 % (1 << 32):08x}"
    }

def split_hash(hash_blocks, username):
    now = datetime.now().isoformat()
    
    return {
        'serverA': {
            'hashFragment': hash_blocks['block1'],
            'metadata': {
                'username': username,
                'created': now,
                'lastAccess': now,
                'userLevel': 'standard'
            }
        },
        'serverB': {
            'hashFragment': hash_blocks['block2'],
            'authHistory': {
                'loginCount': 0,
                'lastLogin': None,
                'failedAttempts': 0,
                'loginHistory': []
            }
        },
        'serverC': {
            'hashFragment': hash_blocks['block3'],
            'context': {
                'ipAddress': f"192.168.1.{random.randint(1, 254)}",
                'userAgent': 'SecureSystem/2.0',
                'sessionId': ''.join(random.choices(string.ascii_lowercase + string.digits, k=12)),
                'location': 'Seoul, KR'
            }
        },
        'serverD': {
            'hashFragment': hash_blocks['block4'][:4],
            'verification': {
                'checksum': hash_blocks['block4'][4:8] if len(hash_blocks['block4']) > 4 else '0000',
                'integrity': True,
                'lastVerified': now
            }
        },
        'serverE': {
            'hashFragment': hash_blocks['block4'][4:8] if len(hash_blocks['block4']) > 4 else '0000',
            'recovery': {
                'seed': ''.join(random.choices(string.ascii_lowercase + string.digits, k=10)),
                'backupHash': hash_blocks['block1'][:4],
                'recoveryKey': ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
            }
        }
    }

# 라우트 설정
@app.route('/')
def index():
    return send_file('public/index.html')

@app.route('/public/<path:filename>')
def serve_public(filename):
    return send_from_directory('public', filename)

@app.route('/config/<path:filename>')
def serve_config(filename):
    return send_from_directory('config', filename)

@app.route('/server/<path:filename>')
def serve_server_files(filename):
    return send_from_directory('server', filename)

# API 엔드포인트들
@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'success': False, 'message': '사용자명과 패스워드가 필요합니다.'}), 400
        
        if username in user_data:
            return jsonify({'success': False, 'message': '이미 존재하는 사용자입니다.'}), 400
        
        if len(password) < 6:
            return jsonify({'success': False, 'message': '패스워드는 6자 이상이어야 합니다.'}), 400
        
        # 해시 생성 및 분할
        hash_blocks = generate_advanced_hash(username, password)
        split_data = split_hash(hash_blocks, username)
        
        # 메모리에 저장
        user_data[username] = split_data
        
        full_hash = hash_blocks['block1'] + hash_blocks['block2'] + hash_blocks['block3'] + hash_blocks['block4']
        
        return jsonify({
            'success': True,
            'message': '회원가입이 완료되었습니다!',
            'hash': full_hash,
            'hashBlocks': hash_blocks
        })
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'success': False, 'message': '사용자명과 패스워드가 필요합니다.'}), 400
        
        if username not in user_data:
            return jsonify({'success': False, 'message': '존재하지 않는 사용자입니다.'}), 400
        
        # 입력된 패스워드로 해시 재생성
        hash_blocks = generate_advanced_hash(username, password)
        stored_data = user_data[username]
        
        # 각 서버의 해시 프래그먼트와 비교
        is_valid = (
            stored_data['serverA']['hashFragment'] == hash_blocks['block1'] and
            stored_data['serverB']['hashFragment'] == hash_blocks['block2'] and
            stored_data['serverC']['hashFragment'] == hash_blocks['block3'] and
            stored_data['serverD']['hashFragment'] == hash_blocks['block4'][:4] and
            stored_data['serverE']['hashFragment'] == hash_blocks['block4'][4:8]
        )
        
        if is_valid:
            # 로그인 성공 - 메타데이터 업데이트
            now = datetime.now().isoformat()
            stored_data['serverB']['authHistory']['loginCount'] += 1
            stored_data['serverB']['authHistory']['lastLogin'] = now
            stored_data['serverB']['authHistory']['failedAttempts'] = 0
            stored_data['serverB']['authHistory']['loginHistory'].append({
                'timestamp': now,
                'success': True,
                'ip': stored_data['serverC']['context']['ipAddress']
            })
            stored_data['serverA']['metadata']['lastAccess'] = now
            
            return jsonify({
                'success': True,
                'message': f'환영합니다, {username}님! 모든 서버에서 인증이 완료되었습니다.',
                'userData': stored_data
            })
        else:
            # 로그인 실패
            stored_data['serverB']['authHistory']['failedAttempts'] += 1
            stored_data['serverB']['authHistory']['loginHistory'].append({
                'timestamp': datetime.now().isoformat(),
                'success': False,
                'ip': stored_data['serverC']['context']['ipAddress']
            })
            
            return jsonify({
                'success': False,
                'message': '패스워드가 올바르지 않습니다.'
            }), 401
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500

@app.route('/api/server-status', methods=['GET'])
def get_server_status():
    return jsonify({
        'status': server_status,
        'userData': user_data,
        'userCount': len(user_data),
        'serverInfo': {
            'A': {'name': 'Primary Server', 'port': 8001, 'type': '32bit_hash + user_metadata'},
            'B': {'name': 'Authentication Server', 'port': 8002, 'type': '32bit_hash + auth_history'},
            'C': {'name': 'Context Server', 'port': 8003, 'type': '32bit_hash + context_info'},
            'D': {'name': 'Verification Server', 'port': 8004, 'type': '16bit_hash + verification_data'},
            'E': {'name': 'Recovery Server', 'port': 8005, 'type': '16bit_hash + recovery_seed'}
        }
    })

@app.route('/api/clear-data', methods=['POST'])
def clear_data():
    global user_data
    user_data = {}
    return jsonify({'success': True, 'message': '모든 데이터가 삭제되었습니다.'})

@app.route('/api/server-config', methods=['GET'])
def get_server_config():
    try:
        with open('config/server_config.json', 'r', encoding='utf-8') as f:
            config = json.load(f)
        return jsonify(config)
    except FileNotFoundError:
        return jsonify({'error': 'Configuration file not found'}), 404

@app.route('/api/sync-servers', methods=['POST'])
def sync_servers():
    # 서버 동기화 시뮬레이션
    sync_results = []
    for server in ['A', 'B', 'C', 'D', 'E']:
        sync_results.append({
            'server': server,
            'status': 'synced',
            'recordCount': len([u for u in user_data.values() if f'server{server}' in u])
        })
    
    return jsonify({
        'success': True,
        'message': '서버 동기화가 완료되었습니다.',
        'results': sync_results
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'servers': server_status,
        'totalUsers': len(user_data)
    })

# 디버그 및 개발용 엔드포인트
@app.route('/api/debug/user/<username>', methods=['GET'])
def debug_user(username):
    if username in user_data:
        return jsonify(user_data[username])
    else:
        return jsonify({'error': 'User not found'}), 404

if __name__ == '__main__':
    print("🔐 SecureAuth 분산 패스워드 보안 시스템 시작")
    print("📡 서버 주소: http://localhost:5000")
    print("🌐 메인 페이지: http://localhost:5000")
    print("🛠️  API 엔드포인트: http://localhost:5000/api/")
    print("📊 서버 상태: http://localhost:5000/api/server-status")
    print("⚕️  헬스 체크: http://localhost:5000/api/health")
    print("=" * 50)
    
    app.run(debug=True, host='0.0.0.0', port=5000)