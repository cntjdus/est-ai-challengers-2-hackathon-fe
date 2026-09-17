# 마이페이지 DB 연결

## 데이터 경로

`MyPage / EditProfilePage → App → AuthGate.saveProfile → saveAccount → hk_save_my_profile → profiles + user_preferences`

클라이언트는 로그인 사용자의 ID를 요청에 넣고, 함수는 `auth.uid()`와 일치하는지 검사합니다. 실제 수정 대상은 항상 `auth.uid()`입니다. 함수는 `SECURITY INVOKER`로 실행하고 테이블의 본인 전용 RLS를 그대로 적용합니다. anon/Public에는 함수 실행 권한을 주지 않습니다.

닉네임과 환경설정은 한 함수 호출에 묶입니다. 클라이언트는 별도 재조회 요청 없이 DB가 반환한 값으로 상태를 갱신하므로 성공한 쓰기 뒤의 별도 조회 실패를 저장 실패로 오해하지 않습니다. 기존 `weekly_cooking_count`, `expiry_alert_days`, avatar, 최초 온보딩 완료 시각을 덮어쓰지 않습니다. 요청에서 생략한 알레르기는 보존하고 빈 배열로 명시한 알레르기는 삭제합니다.

## 직접 확인할 흐름

마이페이지에서 식단 키워드·제외 재료·알레르기를 입력하고 Enter 없이 설정 저장을 누릅니다. 정상 저장 안내 후 F5, 다른 화면 이동 후 복귀, 로그아웃 후 같은 계정 로그인에서 값이 유지되는지 확인합니다. 개인정보 수정에서 닉네임을 바꾸면 마이페이지와 홈의 닉네임이 함께 갱신되어야 합니다. 알림 토글을 끈 뒤 저장하고 다시 열어 확인합니다. 기본 가구 구성은 기존 제품 범위대로 1인 가구입니다.

F12 Network에서 `POST /rest/v1/rpc/hk_save_my_profile` 요청을 확인합니다. 성공 응답은 `profile`과 `preferences`를 포함합니다. `PGRST202`는 함수 미적용 또는 다른 프로젝트 연결 가능성을, `42501`은 로그인 ID/권한 문제를 확인할 단서입니다. SQL Editor에는 일반 사용자의 JWT가 없으므로 함수를 직접 호출할 때 Authentication required가 나는 것은 정상입니다.

## 별도 남아 있는 보안 점검 항목

이번 함수는 본인 범위·익명 접근 차단을 확인했습니다. 프로젝트 전체 점검에서는 아래 기존 항목이 남아 있어, 프로젝트 전체가 경고 없이 안전하다고 판정한 것은 아닙니다. 이번 작업에서 관련 없는 기존 설정을 임의로 수정하지 않았습니다.

- `public.change_inventory_quantity`는 authenticated가 실행 가능한 SECURITY DEFINER 함수라는 경고가 있습니다. 실제 본인 소유 확인 로직을 별도 점검해야 하며, 경고만으로 취약점이 확정된 것은 아닙니다. [점검 안내](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- `public.hk_push_deliveries`는 RLS 활성화·정책 없음이라는 INFO가 있습니다. 서버 전용 테이블이라면 의도된 접근 차단일 수 있습니다. [점검 안내](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
- 유출 비밀번호 보호가 꺼져 있다는 Auth 경고가 있습니다. 비밀번호 로그인 도입 시 확인하세요. Google OAuth Redirect 설정과는 다른 항목입니다. [비밀번호 보호 안내](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

## 참고한 공식 문서

[JavaScript RPC](https://supabase.com/docs/reference/javascript/rpc), [Database Functions](https://supabase.com/docs/guides/database/functions), [Sign out](https://supabase.com/docs/reference/javascript/auth-signout), [Changelog](https://supabase.com/changelog)

패키지 업데이트는 하지 않았습니다. 2026-09-17에 연결 도구로 조회한 저장소 커밋과 DB 스키마를 기준으로 작업했습니다.
