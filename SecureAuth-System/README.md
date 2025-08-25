# 🔐 SecureAuth - 분산 패스워드 보안 시스템

ChaoticRNG 기반 5-Way Split 해시 아키텍처를 사용한 차세대 분산 인증 시스템

## 📋 개요

# 🔐 SecureAuth - 분산 패스워드 보안 시스템

ChaoticRNG 기반 5-Way Split 해시 아키텍처를 사용한 차세대 분산 인증 시스템

## 📋 개요

SecureAuth는 패스워드를 128비트 해시로 변환한 후 5개의 독립된 서버에 분산 저장하는 보안 시스템입니다. 단일 서버 침해로는 전체 패스워드를 복원할 수 없도록 설계되어 높은 보안성을 제공합니다.

## ✨ 주요 특징

- **🎲 ChaoticRNG 해시**: 카오틱 맵을 이용한 예측 불가능한 해시 생성
- **🔀 5-Way Split**: 128비트 해시를 5개 서버에 안전하게 분산
- **🛡️ 하이브리드 보안**: ChaoticRNG + SlightlyHardRNG 결합
- **🌐 웹 인터페이스**: 직관적인 사용자 및 관리자 패널
- **⚡ 고성능**: C++ 기반 해시 엔진으로 빠른 처리
- **📊 실시간 모니터링**: 서버 상태 및 사용자 활동 추적

## 🏗️ 시스템 아키텍처

### 5-Way Split 구조
```
128비트 해시 분할
├── Server A: 32비트 + 사용자 메타데이터
├── Server B: 32비트 + 인증 이력
├── Server C: 32비트 + 컨텍스트 정보  
├── Server D: 16비트 + 검증 데이터
└── Server E: 16비트 + 복구 시드
```

### 프로젝트 구조
```
SecureAuth-System/
├── public/                    # 웹 파일들
│   ├── index.html            # 메인 HTML 파일
│   ├── styles.css            # CSS 스타일
│   └── script.js             # JavaScript 로직
├── server/                   # 서버 관련 파일들
│   ├── hash_server.cpp       # C++ 해시 서버
│   ├── custom_hash.hpp       # 해시 헤더 파일
│   ├── custom_hash.cpp       # 해시 구현
│   ├── rand.hpp              # 랜덤 생성기 헤더
│   └── Makefile              # 빌드 설정
├── config/                   # 설정 파일들
│   └── server_config.json    # 서버 설정
└── README.md                 # 프로젝트 설명
```

## 🚀 빠른 시작

### 1. 프로젝트 클론
```bash
git clone https://github.com/your-username/secureauth-system.git
cd secureauth-system
```

### 2. C++ 서버 빌드
```bash
cd server
make all          # 릴리즈 빌드
# 또는
make debug        # 디버그 빌드
```

### 3. 웹 서버 시작
```bash
# Python을 사용한 간단한 웹 서버
cd public
python3 -m http.server 8000

# 또는 Node.js를 사용
npx http-server -p 8000
```

### 4. 해시 서버 실행
```bash
cd server
./bin/hash_server
```

### 5. 브라우저에서 접속
```
http://localhost:8000
```

## 💻 사용법

### 웹 인터페이스

#### 🌟 사용자 사이트
- **회원가입**: ID, 패스워드, 패스워드 확인 입력
- **로그인**: 등록된 계정으로 인증 테스트
- **실시간 피드백**: 해시 생성 과정 및 결과 표시

#### 🖥️ 서버 관리
- **서버 모니터링**: 5개 서버의 실시간 상태 확인
- **사용자 관리**: 등록된 사용자 목록 및 통계
- **시스템 제어**: 서버 새로고침, 동기화, 데이터 삭제

### C++ 해시 서버

#### 기본 사용법
```bash
./bin/hash_server
```

#### 메뉴 옵션
1. **사용자 등록** - 새 계정 생성
2. **사용자 인증** - 패스워드 검증
3. **서버 상태 확인** - 등록된 사용자 현황
4. **해시 분할 정보** - 특정 사용자의 해시 분포
5. **데이터 백업** - 사용자 데이터 백업
6. **ChaoticRNG 테스트** - 랜덤 생성기 성능 테스트

## 🔧 빌드 옵션

### Make 명령어
```bash
make all          # 기본 릴리즈 빌드
make debug        # 디버그 빌드  
make test         # 테스트 빌드
make clean        # 빌드 파일 정리
make install      # 시스템에 설치
make run          # 서버 실행
make run-test     # 테스트 실행
make run-perf     # 성능 테스트
make help         # 도움말 출력
```

### 컴파일 플래그
- **릴리즈**: `-O3 -DNDEBUG`
- **디버그**: `-g -DDEBUG`
- **표준**: `-std=c++17 -Wall -Wextra`

## 🔒 보안 특징

### 해시 알고리즘
- **ChaoticRNG**: 카오틱 맵 기반 비선형 해시
- **SlightlyHardRNG**: Feistel 네트워크 기반 추가 보안
- **128비트 출력**: 4개의 32비트 블록으로 구성

### 분산 저장
- **단일 침해 저항성**: 하나의 서버만으로는 복원 불가
- **독립적 메타데이터**: 각 서버별 고유 정보 저장
- **무결성 검증**: 체크섬 및 해시 검증 메커니즘

### 추가 보안 기능
- **세션 관리**: 임시 세션 ID 생성
- **실패 추적**: 로그인 실패 횟수 모니터링
- **접근 로그**: 모든 인증 시도 기록

## ⚡ 성능

### 벤치마크 (예상값)
- **해시 생성**: ~100 μs/hash
- **인증 속도**: ~50 μs/verification  
- **처리량**: ~10,000 hashes/sec
- **메모리 사용량**: ~1MB per 1000 users

### 최적화 기능
- **멀티스레딩**: 동시 요청 처리
- **메모리 캐싱**: 빈번한 접근 데이터 캐시
- **SIMD 최적화**: 벡터화된 연산 (컴파일러 지원시)

## 🧪 테스트

### 단위 테스트 실행
```bash
make test
make run-test
```

### 성능 테스트
```bash
make run-perf
```

### 수동 테스트
```bash
# 해시 일관성 테스트
echo -e "1\ntestuser\ntestpass\n12345\n3\n0" | ./bin/hash_server

# 보안 강도 테스트  
echo -e "6\n0" | ./bin/hash_server
```

## 📊 모니터링

### 로그 파일
- **위치**: `logs/secureauth.log`
- **레벨**: INFO, DEBUG, ERROR
- **로테이션**: 100MB 단위로 자동 분할

### 메트릭
- 총 사용자 수
- 성공/실패 인증 횟수
- 서버별 응답 시간
- 메모리 사용량

## 🔧 설정

### 서버 설정 (`config/server_config.json`)
```json
{
  "hash_config": {
    "algorithm": "ChaoticRNG + SlightlyHardRNG Hybrid",
    "hash_size": 128,
    "chaotic_params": {
      "default_seed": 314159,
      "r_value": 3.99
    }
  },
  "security_settings": {
    "min_password_length": 6,
    "max_failed_attempts": 5
  }
}
```

## 🐛 문제 해결

### 일반적인 문제

#### 컴파일 오류
```bash
# C++17 지원 확인
g++ --version

# 의존성 확인  
make check-deps
```

#### 실행 권한 오류
```bash
chmod +x bin/hash_server
```

#### 포트 충돌
```bash
# 포트 사용 확인
netstat -an | grep 8000
lsof -i :8000
```

### 디버깅
```bash
# 디버그 모드 빌드
make debug

# GDB로 실행
make run-debug
```

## 🤝 기여

### 개발 환경 설정
```bash
# 개발 의존성 설치
sudo apt-get install build-essential g++ clang-format cppcheck

# 코드 포맷팅
make format

# 정적 분석
make analyze
```

### 기여 가이드라인
1. Fork 프로젝트
2. Feature 브랜치 생성
3. 변경사항 커밋
4. 테스트 실행
5. Pull Request 생성

## 📄 라이선스

MIT License - 자세한 내용은 LICENSE 파일 참조

## 📞 지원

- **이슈**: [GitHub Issues](https://github.com/your-username/secureauth-system/issues)
- **토론**: [GitHub Discussions](https://github.com/your-username/secureauth-system/discussions)
- **이메일**: support@secureauth.example.com

## 🙏 감사의 말

- ChaoticRNG 알고리즘 개발진
- C++ 커뮤니티
- 보안 연구 커뮤니티

---

**⚠️ 주의사항**: 이 시스템은 교육 및 연구 목적으로 개발되었습니다. 프로덕션 환경에서 사용하기 전에 충분한 보안 검토를 수행하시기 바랍니다.