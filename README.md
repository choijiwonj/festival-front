# 축제잇길 · 베리 위켄드 프런트엔드

Next.js + React + TypeScript + Tailwind CSS 기반 프런트엔드입니다. 화면 데이터는 항상 FastAPI에서 조회하며, 프런트엔드의 가상 축제·후기·장소·프로필·설정·계획과 고정 일정 시연 코드는 제거했습니다.

## 실행

```powershell
cd "C:\Users\User\Documents\Codex\2026-11-15\docs-api-next-js-react-typescript\outputs\festival-front"
npm ci
npm run dev
```

기본 주소는 http://localhost:3000 입니다. 기존 프로젝트가 해당 포트를 사용하면 터미널에 표시되는 다른 Local 주소로 접속하세요. 이 폴더는 Desktop/FestivalProject/frontend와 별개의 프로젝트입니다.

## 백엔드 연결

별도 환경변수가 없으면 Next.js가 /api/v1 요청을 http://127.0.0.1:8000/api/v1 로 전달합니다. 연결 주소를 변경할 때는 .env.example을 참고해 .env.local을 작성하세요.

```dotenv
NEXT_PUBLIC_API_BASE_URL=/api/v1
API_PROXY_TARGET=http://127.0.0.1:8000
```

BACKEND_URL도 프록시 주소로 사용할 수 있으며 API_PROXY_TARGET이 우선합니다. 프록시 환경변수 변경 후에는 개발 서버를 재시작하세요. NEXT_PUBLIC_*는 브라우저에 노출되므로 비밀키를 넣지 마세요.

이전의 데이터 모드·시나리오 환경변수는 사용하지 않습니다. 백엔드가 없으면 오류·재시도 화면, 조회 결과가 없으면 빈 목록을 표시합니다. 서버가 반환한 예시 데이터는 그대로 표시됩니다. 프런트의 시연 코드 제거는 백엔드 DB나 seed 설정을 변경하지 않습니다.

## 화면과 현재 범위

| 화면 | 상태 |
|---|---|
| 홈·전체 축제 | 추천과 목록을 API 조회, 검색·필터·커서·로딩·빈 목록·오류 처리 |
| 축제 상세 | API 응답의 소개·프로그램·교통, 미확인 장소·입장료 처리 |
| 여행 준비 | 축제 ID 존재 여부 확인, 입력·생성 기능 연동 준비 안내 |
| 지도·게시판 | 기능 연동 준비 안내 |
| 마이페이지 | 실제 세션 확인, 프로필·닉네임 인라인 수정, 로그인 후 저장된 계획·내 후기 접근 |
| 설정 | 마이페이지 우측 상단 아이콘 → 설정 허브 → 여행 기본 설정·계정·서비스 안내 |
| 여행 기본 설정 | 로그인 후 실제 설정 조회·저장, 입력 검증·버전 충돌·오류 처리 |
| 저장된 계획 | 로그인 후 목록·상세 API 조회. 후기 API가 없으면 준비 중 안내 |

사용자 정보·여행 기록을 하드코딩하지 않으며 실제 로그인·쓰기·AI 생성이 완료된 것으로 표시하지 않습니다. 브랜드 배너와 이미지가 없는 항목의 기본 마을 일러스트는 디자인 요소로 유지했습니다. 기존 시연용 사진과 화면 캡처는 제거했습니다.

## 코드 구조

```text
src/lib/api/client.ts      공통 fetch·네트워크 오류 처리
src/lib/api/festivals.ts   축제 API 호출·쿼리 직렬화
src/lib/repository.ts      API 구현을 화면에 제공
src/lib/types.ts           요청·응답 타입
src/lib/validation.ts      검색 조건 검증
src/components/            공통 UI와 화면 구성
src/app/                   페이지·디자인 토큰
```

프로그램 API는 data/meta 응답을 사용합니다. 장소·입장료 null을 미확인으로 처리합니다. 부스·라인업 세부 타입 등 실제 데이터 계약이 확정되지 않은 부분은 백엔드와 함께 확인해야 합니다.

## 확인

```powershell
npm run typecheck
npm test
npm run build
```

자동 테스트의 요청 응답 대역은 테스트 파일 안에서만 사용하며 실제 화면에 전달되지 않습니다. Windows 실행 환경의 Turbopack CSS 작업 오류를 피하도록 개발·빌드는 Webpack 옵션을 사용합니다.

홈·지도·게시판·마이페이지 첫 화면에는 뒤로가기를 표시하지 않습니다. 설정과 목록 상세 등 하위 화면에서만 상위 페이지로 돌아갑니다. 예전 /my/profile 주소는 /my로 이동합니다.

로그인은 /auth/session의 실제 세션 쿠키를 사용하고 쓰기 요청에 X-CSRF-Token을 보냅니다. 카카오 로그인은 백엔드의 OAuth 설정이 필요합니다. 로컬 백엔드에서 DEV_LOGIN=1을 켰을 때만 .env.local에 NEXT_PUBLIC_LOGIN_PROVIDER=dev를 설정해 개발용 로그인을 사용할 수 있습니다. 환경변수 변경 후 프런트 서버를 재시작하세요. 운영 환경에서는 kakao를 사용하세요. 프록시와 쿠키를 함께 사용하도록 NEXT_PUBLIC_API_BASE_URL=/api/v1을 권장합니다.

여행 기본 설정의 교통수단·인원·취향·스타일·숙소 선호·출발지 저장 허용을 저장합니다. 기본 출발지 검색/변경과 공지·문의·약관·알림은 준비 중으로 구분합니다. /me/posts가 없는 현재 백엔드에서는 내 후기를 가짜 빈 목록으로 대체하지 않습니다. FastAPI의 경로와 응답 구조는 수정하지 않았습니다.

Vercel Root Directory는 outputs/festival-front, Install Command는 npm ci, Build Command는 npm run build 입니다. API_PROXY_TARGET에 배포된 FastAPI 주소를 설정하세요. 실제 배포는 별도 작업입니다.
