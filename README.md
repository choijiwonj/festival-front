# 축제잇길 · 베리 위켄드

충남 지역축제 연계 여행 플래너의 1차 프런트엔드. Next.js App Router + React + TypeScript + Tailwind CSS로 구현했습니다. 별도 FastAPI 서버를 연동하도록 조회 계층을 분리했습니다.

## 실행

Node.js 20.9 이상이 필요합니다. 검증 환경은 Node.js 24.19.0 / npm 11.17.0입니다.

```powershell
cd "C:\Users\User\Documents\Codex\2026-11-15\docs-api-next-js-react-typescript\outputs\berry-weekend"
npm ci
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인합니다. 별도 환경변수 없이 목 모드로 실행됩니다. 환경변수를 바꾸려면 `.env.example`을 `.env.local`로 복사하고 서버를 재시작하세요. `NEXT_PUBLIC_*` 값은 프로덕션 빌드에 포함되므로 변경 후 재빌드해야 합니다.

```powershell
npm run typecheck
npm test
npm run build
npm start
```

현재 Windows 환경에서 Turbopack의 CSS 작업 프로세스 연결 오류가 발생해, 빌드와 개발 명령은 공식 Webpack 옵션을 사용합니다. Tailwind는 PostCSS로 처리합니다. 폰트와 피그마 에셋은 로컬에서 제공하며 실행 중 피그마·Google Fonts 서버에 의존하지 않습니다.

## 구현 화면

| 경로 | 구현 내용 |
|---|---|
| `/` | 피그마 베리 위켄드 배너, 추천 이유가 있는 축제 카드, 전체 검색, 관심사별 목록 |
| `/festivals` | 이름·지역 검색, 관심사·지역·날짜·정렬 필터, 커서 이동, URL에 적용 조건 유지 |
| `/festivals/[id]` | 기간·장소·비용, 소개·프로그램·교통 탭, 부스·라인업·셔틀·출처·확인 시각, 선택 CTA |
| `/trip?festivalId=...` | 선택 축제 확인, 미리 채워진 예시 조건 폼·날짜 검증·고정 더미 일정 미리보기 (목 모드) |
| `/trip` | 축제 선택 안내. 축제 없이 입력을 시작할 수 없음 |
| `/my` | 예시 프로필, 여행 계획·후기 개수, 하위 메뉴 |
| `/map` | 카페·맛집·놀거리·상점 4곳, 필터·선택, 실제 지도가 아닌 가상 배치도 |
| `/board` | 더미 후기 3개, 본문 펼치기·화면 내 공감 시연 |
| `/my/plans`, `/my/reviews` | 예시 계획 2개·예시 프로필의 후기 2개, 일정 펼치기 |
| `/my/profile`, `/my/settings` | 미리 채워진 프로필·여행 기본값, 화면 내 변경 미리보기 |

하단 홈·지도·게시판·마이페이지 메뉴는 모든 화면에서 유지됩니다. CTA와 하단 내비게이션은 분리되며 safe area와 본문 여백을 확보했습니다. 검색 로딩, 추천/목록 독립 오류·재시도, 결과 없음·초기화, 잘못된 날짜·검색 길이·잘못된 ID를 처리합니다. 요청 취소와 응답 폐기로 이전 응답이 최신 검색을 덮어쓰지 않습니다. 키보드 포커스, 필드 라벨, 탭 방향키 이동, 본문 바로가기, reduced motion을 제공합니다.

## 목 데이터와 실제 기능의 구분

- 모든 축제 이름·일정·프로그램은 가상 시연 데이터입니다. 2027년 5월 날짜는 피그마 예시와 같습니다. 목록은 명세대로 날짜 미입력 시 종료일이 한국 시간 오늘 이후인 축제를 보여 줍니다. 해당 날짜가 지난 뒤에는 날짜 필터로 확인하거나 fixtures를 갱신하세요.
- 홈의 추천은 고정 목 추천이며 LLM을 호출하지 않습니다. 상세의 첫 이미지도 피그마 제공 AI 분위기 이미지로 실제 행사 사진이 아닙니다.
- 현재 로그인·서버 저장·AI 생성·실제 지도 조회·후기 등록을 실행하지 않습니다. 예시 프로필·계획·후기는 모두 DEMO로 구분하고 실제 조회나 저장 성공을 표시하지 않습니다. 프로필·설정·공감 변경은 현재 화면의 메모리에서만 유지됩니다.
- 축제·프로그램은 API DTO 형식의 목 데이터이며 운영시간·부스·셔틀도 가상 예시로 채웠습니다. 출처·확인 시각·좌표는 미확인으로 유지합니다. 비용 0은 무료이며 null과 구분합니다.
- 새 지도·게시판·개인 화면은 `src/lib/mock/demo.ts`의 **UI 시연 전용 fixture**를 사용합니다. 전체 API 저장소를 구현한 것은 아닙니다. `api` 모드에서는 이 화면의 더미 데이터를 노출하지 않고 연결 준비 안내를 제공합니다.
- `NEXT_PUBLIC_MOCK_SCENARIO=empty`는 목록/추천 없음, `error`는 조회 오류를 재현합니다. 기본값은 `success`입니다. 브라우저에서 존재하지 않는 `/festivals/missing`도 오류와 재시도/목록 복귀를 확인할 수 있습니다.

## API 연결

문서는 `docs/`에 복사했습니다. 요구사항 v1.1과 API v0.3의 F01~F03, B01, B05, Q01~Q04, Q08을 이번 범위에 적용했습니다. 기술 스택 정리표의 별도 Python/FastAPI와 Vercel 구성을 따릅니다.

```text
src/lib/types.ts          API v0.3의 DTO·공통 응답
src/lib/repository.ts     환경별 구현 선택
src/lib/mock/            명세 구조의 fixtures·목 저장소
src/lib/api/client.ts     fetch, 오류 코드·필드·requestId 보존
src/lib/api/festivals.ts  실제 축제 조회 API
src/lib/validation.ts     검색 검증·목 검색 동작
src/components/           화면과 공통 요소
```

실제 모드 설정 예시:

```dotenv
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_BASE_URL=/api/v1
API_PROXY_TARGET=https://your-fastapi-server.example
```

`API_PROXY_TARGET`은 `/api/v1`을 제외한 FastAPI 서버 출처입니다. Next.js rewrites가 `/api/v1/:path*`를 FastAPI로 전달합니다. Vercel의 프런트 도메인과 같은 출처에서 쿠키가 동작하도록 이 경로를 사용하세요. 브라우저가 다른 도메인으로 직접 요청하는 구성은 기본으로 사용하지 않습니다.

현재 연동한 경로는 `GET /festivals/recommendations`, `GET /festivals`, `GET /festivals/{id}`, `GET /festivals/{id}/programs`입니다. 요청은 camelCase DTO와 `from/to`, 지역 enum, 반복 `interests` 쿼리, `cursor/limit`을 사용합니다. 추천은 `data/meta`, 전체 목록과 프로그램은 공통 목록의 `data/page/meta`, 상세는 `data/meta` 구조입니다. 전체 개수는 명세에 없으므로 화면은 현재 페이지의 표시 개수만 보여 줍니다.

API 명세는 **구현 전 제안 계약**입니다. `booths[]`, `lineup[]`, `openingHours`, 입장료 `basis`의 세부 타입은 문서에 완전히 정의되지 않아 최소 표시 타입을 사용했습니다. 실제 응답이 정해지면 DTO/어댑터를 확인하세요. JSON에 추가된 미확인 사유 필드는 계약 확정 후 연결할 수 있습니다. 현재 실제 서버와 통합 테스트를 수행한 상태는 아닙니다.

로그인·쓰기 기능을 추가할 때는 HttpOnly/Secure/SameSite=Lax 쿠키, `/auth/session`, 쓰기의 `X-CSRF-Token`, 소유권 검증과 idempotency 계약을 서버와 함께 구현해야 합니다. 비밀키를 `NEXT_PUBLIC_*`에 넣지 마세요.

## Vercel

이 폴더를 저장소 프로젝트 루트로 등록하거나, 상위 저장소에서 Root Directory를 `outputs/berry-weekend`로 지정하세요. Framework Preset은 Next.js, Install Command는 `npm ci`, Build Command는 `npm run build`입니다. FastAPI 서버는 별도로 배포하고 위 환경변수를 설정합니다. 실제 배포는 아직 수행하지 않았습니다.

## 확인 결과

- `npm run typecheck`: 통과.
- `npm test`: 9개 통과. 검색 AND/OR·날짜 경계·한국 날짜 기준·검증·쿼리 직렬화·목 커서·오류·취소·무료/null·실제 API 오류 처리 검증.
- `npm run build`: Webpack 프로덕션 빌드 통과.
- 브라우저: 390px 모바일 홈, 이름/지역 검색, 빈 결과·초기화, 축제 상세 및 소개/프로그램/교통, 선택 후 진입, 축제 없는 `/trip` 안내, 마이페이지 메뉴 확인.
- 더미 확장 확인: 장소 4곳과 맛집 필터, 후기 3개와 본문 펼치기·공감, 예시 계획 2개·일정, 미리 채워진 조건에서 고정 일정 표시를 브라우저로 검증했습니다. 확장 후 타입 검사·기존 테스트 9개·프로덕션 빌드도 통과했습니다.
- 실제 FastAPI·로그인·쓰기·AI 생성·성능 목표·Vercel 배포는 검증 범위에 포함되지 않습니다.

피그마 원본: https://www.figma.com/design/wNRoV3Qyak56ft3G3ATlHj?node-id=1-650

디자인 토큰은 `src/app/globals.css`의 Tailwind theme과 공통 클래스에 정리했습니다. 원본 홈·전체 목록·상세 프레임의 배경/텍스트/베리색/라운드와 로컬 SVG·이미지를 사용했습니다. 실사용을 위해 가짜 휴대폰 상태 표시줄은 생략하고, 웹의 스크롤과 반응형 너비에 맞췄습니다.
