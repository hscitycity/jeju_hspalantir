# 화성형 팔란티어 시스템 — Beta v0.1

팔란티어 스타일 화성시 데이터 인텔리전스 맵 베타 버전.

## 파일 구조

```
hwaseong-intel/
├── index.html          # 프론트엔드 (네이버 지도 + UI)
├── api/
│   ├── search.js       # Vercel Serverless: 네이버 검색 API 프록시
│   └── extract.js      # Vercel Serverless: Claude 장소 추출
├── vercel.json         # Vercel 라우팅 설정
└── .env.example        # 환경변수 템플릿
```

## API 키 발급

### 1. 네이버 클라우드 플랫폼
1. https://www.ncloud.com 회원가입
2. 콘솔 → AI·Application Service → Search → "검색" 신청
3. 콘솔 → Maps → "Maps" 신청
4. Application 등록 → Client ID / Client Secret 복사
5. index.html 에서 `YOUR_NAVER_CLIENT_ID` 를 실제 ID로 교체

### 2. Anthropic API
1. https://console.anthropic.com
2. API Keys → Create Key → 복사

## Vercel 배포 (5분)

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 프로젝트 폴더에서
cd hwaseong-intel
vercel

# 3. 환경변수 설정 (Dashboard > Settings > Environment Variables)
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
ANTHROPIC_API_KEY=...

# 4. 재배포
vercel --prod
```

## 사용법

1. 배포 URL 접속
2. 검색어 입력 (기본: "화성시")
3. "수집 시작" 클릭
4. 뉴스·블로그·카페 데이터 자동 수집 → Claude가 장소 추출 → 지도 마커 표시
5. 마커 클릭 → 원문 링크 확인

## 정식 3-Tier 전환 계획

| 항목 | 베타 | 정식 |
|------|------|------|
| 프론트 | HTML 단일 파일 | React + Vite |
| 백엔드 | Vercel Serverless | Express + Node.js |
| DB | 없음 (메모리) | PostgreSQL + PostGIS |
| 스케줄링 | 수동 | cron 자동 수집 |
| 캐시 | 없음 | Redis |
