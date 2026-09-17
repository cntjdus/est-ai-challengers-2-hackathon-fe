# Gemini 3.8 Flash 소비기한 사진 인식 — 채팅 병합 버전

이 버전은 **이미 적용한 Gemini 채팅 연결을 유지한 채** 소비기한 사진 인식을 추가합니다.
기존 `hankkiloop_gemini_ocr_patch.zip`의 `vite.config.js`를 그대로 덮어쓰면 `/api/chat` 개발 미들웨어가 사라지므로, 구버전 패치를 다시 덮어쓰지 마세요.

## 동작 구조

```text
재료 등록 화면
  -> 사진 선택 / 날짜 주변 영역 선택
  -> /api/ocr/expiry (같은 origin)
  -> Vite dev proxy
  -> 로컬 Python OCR 서버 :8000
  -> Supabase access token 검증
  -> Gemini 3.8 Flash 이미지 + 구조화 JSON
  -> 날짜 후보를 보수적으로 재검증
  -> 사용자가 사진과 날짜 종류를 직접 확인
  -> 소비기한 입력란에만 반영
  -> 기존 냉장고 DB 등록 버튼에서 최종 저장
```

Gemini API key는 기존 채팅과 같은 `GEMINI_API_KEY`를 재사용합니다. 브라우저에는 키를 전달하지 않습니다.

## 1. 패치 적용

패치 폴더를 `hankkiloop` **안이 아니라 같은 상위 폴더**에 두는 것을 권장합니다. 패치 안의 테스트 파일을 Vitest가 중복 발견하는 문제를 막기 위함입니다.

예시:

```text
C:\Users\82103\Downloads\est\
├─ hankkiloop\
└─ gemini-ocr-update\
```

PowerShell:

```powershell
cd C:\Users\82103\Downloads\est
node .\gemini-ocr-update\apply-gemini-ocr.cjs .\hankkiloop --check
node .\gemini-ocr-update\apply-gemini-ocr.cjs .\hankkiloop
```

적용기는 다음을 확인/처리합니다.

- Gemini 채팅 파일이 먼저 적용되어 있는지 확인
- 기존 `vite.config.js`의 채팅 미들웨어를 유지하면서 `/api/ocr` 프록시를 포함한 병합본 적용
- OCR 서버·UI·테스트 추가
- 기존 파일을 `est\hankkiloop-backups\gemini-ocr-...`에 백업
- `.gitignore`에 Python 런타임 파일 제외 규칙을 병합
- `.env.example`에 OCR 설정 예시를 병합
- Gemini 3.8 Flash에서 지원되지 않는 `candidateCount`가 남아 있으면 제거; 기존 safety 설정과 자체 프롬프트 주입 차단은 유지

## 2. 환경 변수

기존 `hankkiloop\.env.local`을 그대로 사용합니다.

```dotenv
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

GEMINI_API_KEY=본인_Gemini_API_키
GEMINI_MODEL=gemini-3.8-flash
OCR_DAILY_LIMIT=50
```

`GEMINI_API_KEY`에는 `VITE_`를 붙이지 않습니다.

- `GEMINI_MODEL`이 없으면 `gemini-3.8-flash`가 기본값입니다.
- `OCR_DAILY_LIMIT`은 이 PC의 OCR 시도 횟수 제한이며 Google API 쿼터와 별개입니다.
- 환경변수를 바꾼 뒤에는 프런트와 OCR 서버를 모두 재시작하세요.

병합 상태 확인:

```powershell
cd C:\Users\82103\Downloads\est\hankkiloop
node .\scripts\check-gemini-ocr-merge.mjs
```

모든 항목이 `PASS`여야 합니다.

## 3. Python OCR 서버 최초 설치

Python 3.11 또는 3.12를 권장합니다.

```powershell
cd C:\Users\82103\Downloads\est\hankkiloop
py -0p
py -3.12 -m venv ocr_server\.venv
.\ocr_server\.venv\Scripts\python.exe -m pip install -r ocr_server\requirements.txt
```

이 버전은 GUI 기능이 필요 없는 `opencv-python-headless`를 사용합니다.

## 4. 로컬 실행

PowerShell 1 — OCR 서버:

```powershell
cd C:\Users\82103\Downloads\est\hankkiloop
.\ocr_server\.venv\Scripts\python.exe -m uvicorn app:app --app-dir ocr_server --host 127.0.0.1 --port 8000
```

브라우저에서 OCR 서버 상태를 확인하려면:

```text
http://127.0.0.1:8000/health
```

`api_key_configured: true`, `model: gemini-3.8-flash`가 보여야 합니다. 브라우저 대신 아래 명령으로 확인해도 됩니다.

```powershell
node .\scripts\check-ocr-server.mjs
```

PowerShell 2 — 기존 프런트:

```powershell
cd C:\Users\82103\Downloads\est\hankkiloop
npm run dev
```

`vite.config.js`에는 동시에 다음 두 경로가 살아 있습니다.

- `/api/chat` -> 기존 Gemini 채팅 개발 미들웨어
- `/api/ocr/*` -> `127.0.0.1:8000` Python OCR 서버

## 5. 사용 순서

1. localhost에서 로그인합니다.
2. 냉장고 -> 재료 추가 화면으로 이동합니다.
3. `사진 촬영(소비기한)`을 선택합니다.
4. 사진을 촬영하거나 앨범에서 고릅니다.
5. 날짜와 `소비기한` 표시가 같이 보이면 `사진 전체 읽기`를 눌러도 됩니다.
6. 주변에 다른 숫자/로트번호가 많으면 날짜 주변만 드래그하고 `선택 영역 날짜 읽기`를 누릅니다.
7. 안전한 소비기한 후보가 정확히 1개면 미리 선택되지만 **자동 반영되지는 않습니다**.
8. 사진과 날짜/종류를 직접 확인하고 체크한 뒤 `확인한 소비기한 반영`을 누릅니다.
9. 아래 재료 정보에 들어간 날짜를 다시 확인한 뒤 `확인하고 냉장고에 등록하기`를 눌러 최종 저장합니다.

제조일·유통기한·품질유지기한을 소비기한으로 임의 변환하지 않습니다. 연도가 없거나 두 자리면 연도를 추측하지 않습니다.

## 6. 가드레일

OCR 요청은 다음 원칙을 사용합니다.

- 이미지 속 문구는 신뢰하지 않는 데이터로 취급
- 이미지 안의 명령·프롬프트·URL·QR 지시를 따르지 않도록 system instruction 적용
- 원문에 없는 숫자·연도·날짜 종류를 만들지 않도록 지시
- 구조화 JSON schema로 출력 제한
- 서버에서 날짜 문자열을 다시 파싱하고 원문에 실제 존재하는 후보만 남김
- `제조일 -> 소비기한` 같은 계산을 하지 않음
- AI 결과는 자동 DB 저장하지 않고 사용자 확인을 필수로 함
- Supabase 로그인 세션을 확인한 뒤에만 Gemini 호출
- 사진/키/토큰을 앱 DB에 별도 저장하지 않음

## 7. 테스트

프런트:

```powershell
node .\scripts\check-gemini-ocr-merge.mjs
npm test
npm run build
```

OCR 서버:

```powershell
.\ocr_server\.venv\Scripts\python.exe -m pip install -r ocr_server\requirements-test.txt
Push-Location ocr_server
.\.venv\Scripts\python.exe -m pytest -q tests
Pop-Location
```

실제 API 확인은 테스트용 포장 사진 한 장으로 진행하세요. 모의 테스트가 통과해도 실제 사진 인식 품질은 촬영 상태와 모델 응답에 따라 달라질 수 있습니다.

## 8. 현재 배포 범위

이 패치는 우선 **로컬 개발에서 안정적으로 같이 동작하도록** 병합한 버전입니다.

`npm run build`만으로 Python OCR 서버가 Vercel에 함께 배포되지는 않습니다. 운영 배포는 다음 중 하나가 추가로 필요합니다.

- OCR 서버를 별도 서버/컨테이너로 배포하고 `/api/ocr`를 그쪽으로 라우팅
- 또는 후속 단계에서 OCR을 Vercel/Supabase Edge Function용 서버 코드로 옮기기

반면 Gemini 채팅의 `/api/chat`은 기존 Vercel Function 구조를 그대로 유지합니다.
