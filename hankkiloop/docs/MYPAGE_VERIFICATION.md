# 마이페이지 변경 검증 기록

기준: `5a76119496a5f4f7b3f605cfc5bddac33e3f00b2`
DB: `brhsnjiwmadnniuecoof`, 마이그레이션 `20260917044006_hk_mypage_atomic_save`

## 실행한 검사

1. `node scripts/test-mypage.mjs`: 핵심 JS 검사 36개. 태그 정리·미확정 입력 수집·닉네임 검증·계정 매핑·RPC 인자/오류/사용자 격리·로그아웃 정책·오류 안내를 검사합니다. API와 브라우저 동작은 단위 검사에서 mock을 사용합니다.
2. 실제 Supabase DB: authenticated 역할과 임시 사용자 JWT sub를 설정해 함수 저장·반환값·DB 재조회, 다른 사용자 행 비노출, 다른 ID 저장 거부, 잘못된 닉네임 거부, 태그 중복 제거, 생략 필드 보존, 알레르기 비우기, 온보딩 시각 보존을 확인했습니다. 임시 사용자와 테스트 수정은 전체 트랜잭션 ROLLBACK으로 제거했습니다.
3. 함수 메타데이터: SECURITY INVOKER, anon 실행 불가, authenticated 실행 가능 확인.
4. TypeScript 파서를 이용한 JS/JSX 14개 파일과 App 저장 핸들러 3개 구문 검사. 타입 검사·전체 import 해결·번들 빌드가 아닙니다.
5. 적용기 합성 fixture 시나리오 7개: dry run 무변경, 패치/교체 적용 및 관계없는 파일 보존, 재실행/하위 경로 지원, CRLF 지원, 기존 파일 충돌 시 전부 중단, 새 파일 이름 충돌 시 중단, 잘못된 루트 경로 거부. 실제 저장소 전체를 설치한 통합 테스트는 아닙니다.
6. Supabase security advisor 실행. 마이페이지 저장 함수와 별도로 기존 경고가 남아 있으며 상세는 MYPAGE_CONNECTION.md에 기록했습니다.

## 실행하지 않은 검사

- 전체 저장소 `npm test`, `npm run build`, `npm run lint`
- 추가한 `tests/mypage.test.jsx` React 화면 회귀 테스트
- 실제 브라우저 Google OAuth, 모바일/푸시 동작, Vercel 배포 후 화면 확인

실행 환경에서 외부 Git/npm 접근이 되지 않아 전체 앱과 의존성을 설치하지 못했습니다. 핵심 로직·DB 검사 통과를 전체 브라우저 통합 검증 완료로 해석해서는 안 됩니다.
