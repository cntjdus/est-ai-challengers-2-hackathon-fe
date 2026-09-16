# 스크랩·알림·단위 환산 적용

기준: GitHub main `80892cf411e2dde0f4d9f8934c5e1e654d7127d7`.
이 변경은 주변 매장·실판매 상품 API를 추가하지 않습니다.

## 1. DB와 프런트 적용

기존 로그인·냉장고·레시피 DB가 연결된 프로젝트에 적용합니다.
Supabase SQL Editor에서 기존 `docs/shopping_setup.sql`이 적용돼 있는지 확인하고,
이번 `docs/user_features_setup.sql` 전체를 실행하세요. 반복 실행해도 기존 데이터를 삭제하지 않습니다.
이 SQL을 실행하기 전 새 프런트를 배포하면 스크랩·환산 조회 오류가 표시됩니다.
기존 장바구니 SQL을 다시 실행했다면 이번 SQL도 마지막에 다시 실행하세요.

프로젝트의 `hankkiloop` 폴더에서:

```powershell
npm ci
npm test
npm run lint
npm run build
npm run dev
```

스크랩 버튼은 DB 저장 성공 후 바뀌며 목록·상세·재접속에서 유지됩니다.
저장 중 중복 클릭을 막고 실패 시 오류와 재조회 버튼을 표시합니다.
알림의 개별 읽음/모두 읽음도 사용자별 DB에 저장합니다.
알림 종류는 마이페이지에서 저장한 소비기한/메뉴 추천 설정을 따릅니다.
다른 창에서 저장한 상태는 이 창으로 돌아올 때 다시 읽습니다.

## 2. 단위 환산 사용

마이페이지 → 품목별 단위 환산 → 품목·단위·기준 수량 → 저장.
예: 직접 확인한 두부가 1모에 300g이라면 두부, 개·모·대, 300을 입력합니다.
실제 제품의 표시나 측정값을 사용하세요. 예시 300g은 자동 기본값이 아닙니다.

- 품목의 기준 단위는 기존 `food_items.base_unit`(g/ml/ea)입니다.
- 기준은 내 계정에만 저장되며 같은 품목의 모든 재고에 적용됩니다.
- DB는 개·모·대를 `ea`로 저장합니다. 포장 규격이 다른 재료는 g·ml로 직접 등록하세요.
- ml 기준 품목은 계량 큰술 15ml, 작은술 5ml를 적용합니다. 직접 입력한 기준이 우선합니다.
- 환산 기준 없는 g↔개·팩 등은 합산하지 않고 기존 단위로 유지합니다.
- 레시피 필요량·냉장고 보유량·추천·새 장바구니를 같은 기준 단위로 계산합니다.
- 실제 차감은 소비기한이 빠른 재고부터 원래 DB 등록 단위로 되돌려 처리합니다.
- 원래 저장 단위 소수점 네 자리로 반올림합니다. 너무 작은 차감은 거부합니다.
- 기존 장바구니 구매량은 저장 당시 수량을 유지합니다. 재고 배정량은 새 장보기 시 환산해 중복 사용을 막습니다.
- 이미 배정된 다른 단위의 환산 기준을 삭제하면, 복구하거나 기존 장바구니를 완료·삭제하기 전까지 새 배정을 차단합니다.
- 자유 입력 식재료는 표준 품목명/유일한 별칭과 매칭될 때만 품목별 환산을 적용합니다.

## 3. 푸시 서버 설정

스크랩·읽음·환산은 위 SQL과 프런트로 사용할 수 있습니다.
앱을 닫은 동안의 푸시 발송은 아래 서버 설정까지 필요합니다.
이 저장소에는 실제 비밀키나 운영 발송 스케줄이 포함돼 있지 않습니다.

1. VAPID 키 한 쌍을 생성합니다. 최초 1회만 생성하고 개인키를 보관하세요.

```powershell
npx --yes --package=web-push@3.6.7 web-push generate-vapid-keys
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

두 번째 명령의 결과를 `PUSH_CRON_SECRET`으로 사용합니다.
`.env.push.local` 파일을 만들어 아래 값을 넣습니다. 이 파일은 git에서 제외됩니다.

```dotenv
WEB_PUSH_PUBLIC_KEY=생성한_Public_Key
WEB_PUSH_PRIVATE_KEY=생성한_Private_Key
WEB_PUSH_SUBJECT=mailto:운영자_이메일
PUSH_CRON_SECRET=생성한_64자리_난수
```

2. 프런트 `.env.local`과 Vercel의 해당 배포 환경에 `VITE_WEB_PUSH_PUBLIC_KEY`를 같은 공개키로 설정합니다.
   개인키와 Cron secret은 `VITE_` 변수로 넣지 않습니다.
3. `hankkiloop` 폴더에서 Supabase에 로그인하고 서버 비밀키와 함수를 배포합니다.

```powershell
npx supabase login
npx supabase secrets set --env-file .env.push.local --project-ref YOUR_PROJECT_REF
npx supabase functions deploy send-notifications --project-ref YOUR_PROJECT_REF --use-api
```

`supabase/config.toml`의 `verify_jwt=false`는 예약 호출을 위한 설정입니다.
함수 자체에서 32자 이상 `x-cron-secret`을 검증하며 일반 사용자 키로는 호출할 수 없습니다.
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`는 호스팅 Edge Function의 기본 서버 환경을 사용합니다.
함수 코드는 프런트 빌드에 포함되지 않습니다.

4. Dashboard에서 Cron(`pg_cron`)과 `pg_net`을 활성화합니다.
5. Vault에 `hk_project_url`(프로젝트 URL), `hk_push_cron_secret`(위 Cron secret과 같은 값)을 등록합니다.
6. `docs/push_schedule_setup.sql`을 실행합니다. 이 단계부터 한국시간 09~20시 매시 정각 발송 작업이 시작됩니다.
7. 프런트를 새 공개키로 빌드·배포한 뒤 마이페이지에서 원하는 알림 종류를 저장하고 **이 기기 푸시 켜기**를 누릅니다.

지원되는 HTTPS 브라우저에서 권한을 허용해야 합니다. iPhone/iPad는 홈 화면에 추가한 앱에서 설정합니다.
권한 거절·미지원·키 미설정은 화면에 안내하며 수신 성공으로 표시하지 않습니다.
계정마다, 기기마다 켜야 하며 로그아웃 시 해당 기기 구독을 해제합니다.
공개키를 바꾸면 기존 사용자는 푸시를 다시 켜야 합니다.

## 4. 발송 동작과 확인

- 소비기한 6~10일은 냉큼이 알림, 5일 이내 및 기한 경과는 소비임박 알림입니다.
- 같은 재고·날짜·분류는 같은 기기에 한 번 전송합니다. 분류가 바뀌면 새 알림입니다.
- 메뉴 추천은 11시 이후 점심, 17시 이후 저녁으로 기기당 하루 최대 두 번입니다.
- 서버도 동일한 알레르기·비선호 필터 및 재고 추천 로직을 사용합니다.
- 앱에서 이미 읽은 알림은 발송하지 않습니다. 날짜 경계는 한국시간으로 통일했습니다.
- 한 작업이 발송을 선점하며, 일시 실패는 10분 이후 다음 예약 실행에서 재시도합니다.
- 만료 응답(404/410)은 구독을 제거합니다. 허용된 브라우저 푸시 제공자 URL만 사용합니다.
- 제공자가 수락한 직후 DB 기록에 실패하면 재시도 시 중복 전달될 수 있습니다. 브라우저 알림 tag로 같은 이벤트를 묶습니다.
- 서버 작업은 작은 MVP 규모를 위한 순차 처리입니다. 대규모 사용자 운영 시 큐와 분할 작업으로 확장하세요.
- 임박 알림은 기존 재고 데이터에서 생성됩니다. 삭제·소진한 재고의 알림 기록을 별도 보관하는 알림함은 아닙니다.

예약을 끄려면 SQL Editor에서 `select cron.unschedule('hk-push-hourly');`를 실행합니다.
설정 직후에는 SQL의 `net.http_post` 부분만 수동 실행해 다음 정각 전에도 확인할 수 있습니다.
브라우저를 닫고 수신 확인 → 클릭 후 해당 재료/레시피 열기 → 읽음 처리 → 새로고침 → 다른 계정으로 확인하세요.
서버는 한국시간 09~21시 밖에서는 전송하지 않으므로 테스트도 해당 시간에 진행합니다.

## 검증

```powershell
npm test
npm run lint
npm run build
node tests/validate-shopping.cjs
node tests/validate-user-features.cjs
```

SQL 검증은 실제 PostgreSQL 엔진을 사용하는 PGlite의 격리 DB에서 수행합니다.
사용자별 접근 제한, 타인 소유권 변경 거부, 반복 설치, 환산 단위 예약량, 발송 선점/재시도를 검증합니다.
운영 SQL 실행·서버 비밀키 등록·함수 배포·실기기 푸시 수신은 별도 적용 확인이 필요합니다.

참고: [Supabase 예약 함수](https://supabase.com/docs/guides/functions/schedule-functions),
[Web Push](https://github.com/web-push-libs/web-push),
[브라우저 구독](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe).
