# 여행 생성 API 연결

현재 실행 폴더 `C:\Users\User\OneDrive\Desktop\test`에 적용하는 여행 생성 연결 코드입니다. 원본 작업본은 `outputs/festival-front`에 있습니다.

## 연결한 흐름

축제 상세 → 로그인(선택한 축제 ID 유지) → 여행 날짜·출발지·교통 → 인원·예산·취향·숙박·필수 장소/프로그램 → 서버 조건 검증 → 생성 접수 → 작업 상태 조회 → 저장된 계획 상세.

| 동작 | 기존 FastAPI 경로 |
|---|---|
| 로그인 상태 | GET /api/v1/auth/session |
| 아이디·비밀번호 로그인 | POST /api/v1/auth/login |
| 카카오 로그인 | GET /api/v1/auth/login/kakao |
| 출발지 검색 | GET /api/v1/locations/search |
| 주변 필수 장소 | GET /api/v1/places?festivalId=... |
| 입력 검증 | POST /api/v1/trip-requests/validate |
| 생성 접수 | POST /api/v1/trip-requests |
| 진행 확인 | GET /api/v1/jobs/{id} |
| 진행 중 요청 | GET /api/v1/me/trip-requests?status=ACTIVE |
| 결과/저장된 계획 | GET /api/v1/trip-plans/{id}, GET /api/v1/me/trip-plans |
| 같은 조건 재추천 | POST /api/v1/trip-plans/{id}/regenerations |

쓰기 요청은 실제 세션의 CSRF 토큰을 보내며, 생성·재추천 요청은 중복 방지 UUID를 사용합니다. 통신 실패로 같은 요청을 재시도할 때는 같은 키를 유지하고, 조건을 바꾸면 키를 새로 만듭니다. 완료 응답에 planId가 없으면 성공으로 처리하지 않습니다. 진행 화면은 최대 3분 동안 조회한 뒤 계속 확인하기를 제공하며, 이는 서버 작업 취소가 아닙니다. 다른 화면으로 이동해도 마이페이지의 진행 중 요청으로 복귀할 수 있습니다.

로그인 시작은 Next.js의 `/auth/start`에서 백엔드로 전달하고 OAuth 쿠키를 같은 출처로 유지합니다. 로그인 서비스가 미설정이거나 연결 실패하면 원시 JSON 화면 대신 로그인 페이지에 오류를 표시합니다. 실제 카카오 콜백은 기존 `/api/v1/auth/callback/kakao` 프록시를 사용합니다.

## 현재 키 미설정 상태

기본 로그인은 실제 DB 계정의 아이디·비밀번호를 사용합니다. 카카오 로그인은 보조 연결로 유지합니다. 아이디 로그인에는 카카오 키가 필요하지 않습니다. 실제 카카오 계정 로그인·출발지 외부 검색·Gemini 호출은 키 발급 후 확인해야 합니다. 실제 서비스 화면에 가짜 로그인이나 고정 생성 결과를 넣지 않았습니다.

아이디 로그인 요청은 `{ "username": "계정 아이디", "password": "비밀번호" }`이며, 응답은 `{ data: { user, csrfToken }, meta }`와 HttpOnly 세션 쿠키입니다. 로그인 POST만 기존 세션 CSRF 없이 호출하고, 이후 쓰기 API는 세션의 CSRF 토큰을 계속 사용합니다. 백엔드가 로그인 요청의 Origin을 확인합니다. 다른 프런트 포트를 사용할 때는 백엔드 FRONTEND_ORIGIN도 실제 주소로 설정하세요. 비밀번호는 local_credentials 테이블에 무작위 salt를 사용한 scrypt 해시로만 저장하며, Supabase 공개 API 역할의 테이블 읽기 권한은 차단합니다. 공개 회원가입 API는 추가하지 않았습니다.

백엔드 `C:\Users\User\FestivalProject\backend\.env`에 설정할 항목:

```dotenv
DEV_LOGIN=0
SEED_DEMO=0
COOKIE_SECURE=0
KAKAO_REST_API_KEY=발급받은_REST_API_키
KAKAO_REDIRECT_URI=http://localhost:3000/api/v1/auth/callback/kakao
GEMINI_API_KEY=발급받은_Gemini_키
```

위 예시를 그대로 붙여넣어 가짜 문자열로 채우면 안 됩니다. 실제 키가 준비된 항목만 설정하세요. 카카오 Client Secret을 켰다면 KAKAO_CLIENT_SECRET도 필요합니다. 카카오 앱에 같은 Redirect URI를 등록해야 합니다. 모델을 별도로 지정할 때는 GEMINI_MODEL에 계정에서 사용할 수 있는 모델 ID를 넣습니다. 자가용 경로는 KAKAO_MOBILITY_REST_API_KEY, 대중교통 경로는 ODSAY_API_KEY를 사용합니다. 키는 백엔드에만 보관하며 NEXT_PUBLIC_*로 노출하지 않습니다.

PostgreSQL에서는 DEV_LOGIN=1/SEED_DEMO=1을 사용할 수 없습니다. 로컬 HTTP에서 COOKIE_SECURE=0, HTTPS 배포에서는 1을 사용합니다. 백엔드 키 수정 후 서버를 재시작해야 합니다.

프런트 `.env.local`은 기존 설정을 유지하되 다음과 같은 형태로 연결합니다.

```dotenv
API_PROXY_TARGET=http://127.0.0.1:8000
NEXT_PUBLIC_API_BASE_URL=/api/v1
NEXT_PUBLIC_LOGIN_PROVIDER=kakao
```

BACKEND_URL도 프록시 주소로 지원하며 API_PROXY_TARGET이 우선합니다. 프런트 환경변수 수정 후에도 개발 서버를 재시작해야 합니다.

## 실제 결과와 미확인 정보

Gemini 키가 없으면 백엔드는 축제·필수 일정 중심으로 구성하고 NO_CANDIDATES 안내를 반환합니다. 화면은 이를 AI 추천 완료로 표현하지 않습니다. 가까운 장소로 대체한 경우 AI_RECOMMENDATION_FALLBACK을 따로 표시합니다. 지도·이동시간·가격·영업시간·체류시간이 미확인인 경우 해당 경고와 미정 값을 그대로 표시합니다. 저장된 기본값은 사용자가 입력한 값을 덮어쓰지 않으며, 화면 포커스가 바뀌어 로그인 상태를 재확인할 때도 작성 중인 폼을 유지합니다.

추가 요청은 저장되지만 현재 백엔드가 모든 자유 문장을 생성 입력으로 반영하지는 않습니다. 결과의 추천 이유와 경고를 확인해야 합니다. 축제 취소·날짜 역전·기간/축제일 범위·1박 2일 한도·인원·예산·출발지 선택·프로그램 확정 시각을 검사합니다.

## 확인 결과

- 타입 검사와 자동 테스트 19개 통과.
- 별도 임시 SQLite FastAPI(8011)와 테스트 프런트(3120)에서 로그인 복귀, 출발지/주변 장소 검색, 조건 검증, 당일/1박 2일 생성·저장, 날짜 전환, 재추천, 진행 중 요청 재진입, 실패 화면 확인.
- 테스트의 외부 위치 검색 응답은 테스트 서버에서만 대체하고 외부 AI 호출은 하지 않았습니다. 실제 Supabase에 테스트 회원·일정·세션을 만들지 않았습니다.
- 테스트용 코드와 DB는 작업 폴더 work/에만 있고 프런트 배포 코드에 포함되지 않습니다. 테스트 화면 캡처의 예시 데이터는 실제 서비스 데이터가 아닙니다.
- 실제 Gemini와 카카오 OAuth는 키가 준비되지 않아 검증하지 않았습니다.
