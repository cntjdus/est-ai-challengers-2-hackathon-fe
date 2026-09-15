# Google 로그인 연결

기존 로그인 디자인에 Supabase Google OAuth(PKCE)를 연결했습니다. 신규 회원은 닉네임과 취향 설정을 저장한 뒤 앱으로 이동하고, 기존 회원은 세션 복원 후 바로 이용합니다. 마이페이지의 프로필·취향·알림 설정과 로그아웃도 연결했습니다.

## 1. DB 준비

공유받은 기존 `public.profiles`, `public.user_preferences` 테이블을 사용합니다. Supabase SQL Editor에서 [마이그레이션](../supabase/migrations/20260915_auth_preferences.sql)을 실행하세요. 추가하는 컬럼은 `cooking_frequency`, `recipe_suggestion_enabled` 두 개이며, 이미 있으면 건너뜁니다. 기존 테이블·데이터·RLS·가입 트리거를 삭제하지 않습니다.

기존 RLS가 활성화되어 있어야 하며 로그인한 사용자가 자기 행을 조회·생성·수정할 수 있어야 합니다. 공유받은 정책 기준 소유자 조건은 `profiles.id = auth.uid()`, `user_preferences.user_id = auth.uid()`입니다. 가입 트리거가 프로필을 만들지 않은 경우 클라이언트가 자신의 프로필을 생성합니다. 동시 생성 시 기존 행을 덮어쓰지 않습니다.

## 2. Google과 Supabase 설정

1. Google Cloud Console에서 OAuth 동의 화면과 **웹 애플리케이션** OAuth 클라이언트를 만듭니다. 테스트 모드라면 로그인할 계정을 테스트 사용자로 등록하세요.
2. Google의 승인된 JavaScript 원본에 `http://localhost:5173`과 `https://est-ai-challengers-2-hackathon-fe.vercel.app`을 등록합니다.
3. Google의 승인된 리디렉션 URI에는 Supabase의 Google 제공자 설정에 표시되는 콜백 URL을 등록합니다. 보통 `https://<프로젝트-ref>.supabase.co/auth/v1/callback`입니다. 아래 프런트엔드 콜백 URL과 서로 다릅니다.
4. Supabase Dashboard → Authentication → Sign In / Providers → Google에서 제공자를 활성화하고 Google Client ID와 Client Secret을 입력합니다. Client Secret은 Supabase 설정에만 넣습니다.
5. Authentication → URL Configuration의 Site URL을 `https://est-ai-challengers-2-hackathon-fe.vercel.app`로 설정합니다. Redirect URLs에는 다음 두 주소를 추가합니다.

```text
http://localhost:5173/auth/callback
https://est-ai-challengers-2-hackathon-fe.vercel.app/auth/callback
```

Preview 배포에서 로그인하려면 해당 배포 주소의 `/auth/callback`도 등록해야 합니다. 앱은 현재 접속한 origin으로 돌아오도록 요청합니다.

공식 안내: [Supabase Google 로그인](https://supabase.com/docs/guides/auth/social-login/auth-google), [리디렉션 URL](https://supabase.com/docs/guides/auth/redirect-urls).

## 3. 로컬 실행

```bash
cd hankkiloop
npm ci
cp .env.example .env.local
```

`.env.local`에 본인의 프로젝트 값을 입력합니다.

```dotenv
VITE_SUPABASE_URL=https://<프로젝트-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<프로젝트의-publishable-key>
```

Supabase의 프로젝트 연결/API 설정에서 값을 확인할 수 있습니다. 기존 프로젝트의 anon 키는 `VITE_SUPABASE_ANON_KEY`로도 지원합니다. 브라우저에 공개되는 환경변수이므로 `service_role`, `sb_secret_` 키나 Google Client Secret을 넣으면 안 됩니다. `.env.local`은 Git에서 제외되어 있습니다.

```bash
npm run dev
```

환경변수를 변경했다면 개발 서버를 재시작합니다. 설정이 없으면 로그인 버튼이 비활성화되고 연결 준비 안내가 표시됩니다.

## 4. Vercel 설정

프로젝트 Root Directory는 `hankkiloop`으로 설정하고 위 두 환경변수를 해당 Production/Preview 환경에 등록한 뒤 다시 빌드합니다. `vercel.json`의 SPA rewrite가 `/auth/callback`과 `/mypage` 같은 직접 접속 경로를 처리합니다.

## 저장되는 데이터와 현재 범위

| 화면 | DB 필드 |
| --- | --- |
| 닉네임 | `profiles.display_name` |
| 최초 설정 완료 | `profiles.onboarding_completed_at` |
| 주간 요리 빈도 구간 | `user_preferences.cooking_frequency` |
| 선호 식단 태그 | `user_preferences.preferred_tastes` |
| 제외 식재료 | `user_preferences.excluded_ingredients` |
| 소비기한 알림 선택 | `user_preferences.expiry_alert_enabled` |
| 메뉴 추천 알림 선택 | `user_preferences.recipe_suggestion_enabled` |

Google 이름과 이메일은 인증 계정에서 읽습니다. 기존 `weekly_cooking_count`, `allergies`, `expiry_alert_days`는 이 화면에서 덮어쓰지 않습니다. 빈도 구간이 없는 기존 회원은 주간 횟수를 구간으로 표시합니다. 알림 선택은 설정값 저장이며 실제 푸시/메일 발송 기능은 별도입니다.

취향 저장 성공 후 프로필과 최초 설정 완료 시간을 저장합니다. 두 요청은 하나의 DB 트랜잭션이 아니므로 두 번째 요청 실패 시 취향만 저장될 수 있습니다. 오류 화면에서 재시도할 수 있습니다.

냉장고·레시피·장바구니·AI·알림 목록은 기존 데모 데이터 흐름입니다. 로그인 연동이 이 기능들의 DB 연동까지 완료하지는 않습니다. 계정 변경 시 앱 상태를 초기화하고 다른 회원의 브라우저 히스토리 상태를 복원하지 않습니다.

필수 약관 확인과 선택 알림 체크는 기본 해제되어 있습니다. 실제 약관·개인정보 처리방침 문서와 버전별 동의 이력 저장은 아직 연결되지 않았고, 관련 버튼에는 준비 안내가 표시됩니다. 서비스 공개 전에 실제 문서와 동의 기록 방식을 연결하세요.

## 검증

```bash
npm test
npm run lint
npm run build
```

자동 테스트는 인증 SDK/DB 응답을 모의하여 로그인 오류, 세션 복원, 온보딩 저장 실패·재시도, 계정별 히스토리 분리, 기존 프로필 보존과 앱 설정 저장을 검증합니다. 실제 프로젝트에 OAuth 요청이나 DB 변경을 실행한 검증은 아닙니다. 작업 환경에서는 로컬 브라우저 접속도 차단되어 시각 검증을 완료하지 못했습니다.

실제 설정 후 신규 계정으로 로그인 → 닉네임/취향 저장 → 새로고침 → 마이페이지 수정 → 로그아웃을 확인하세요. 기존 회원으로 다시 로그인하면 온보딩을 건너뛰어야 합니다. 다른 Google 계정으로 로그인했을 때 이전 회원 정보가 표시되지 않는지도 확인하세요. 서로 다른 계정의 인증 세션으로 상대방 ID를 조회·수정했을 때 RLS가 차단하는지 확인해야 합니다.

문제 해결: Google 로그인 실패는 제공자 활성화 및 두 종류의 콜백 URL을, 저장 실패는 두 컬럼 마이그레이션과 소유자 RLS를 확인하세요. 앱은 상세 DB 오류나 OAuth 쿼리 내용을 사용자에게 그대로 출력하지 않습니다.
