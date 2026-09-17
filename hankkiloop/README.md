# 냉큼 날짜 OCR — Gemini 연결판 v2

촬영·영역 선택 화면과 `/ocr/expiry`를 유지하고 인식 엔진을 Gemini 3.8 Flash로 교체했습니다. Python 3.11 또는 3.12를 사용하세요. PaddleOCR 모델 다운로드는 필요 없습니다.

## 기존 Windows 설치에 적용

1. 서버에서 `Ctrl+C`를 눌러 중지합니다.
2. ZIP 안 `expiry_ocr_rebuild` 폴더의 **내용물**을 기존 `app.py`가 있는 폴더에 덮어씁니다. `.venv`와 기존 `.env`는 유지합니다. ZIP에는 실제 키가 든 `.env`가 없습니다.
3. PowerShell에서 실행합니다.

```powershell
cd "C:\Users\우성한\Downloads\expiry_ocr_rebuild\expiry_ocr_rebuild"
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
if (!(Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

메모장에서 `GEMINI_API_KEY=YOUR_API_KEY` 오른쪽에 본인 키를 넣고 저장합니다. 파일 이름은 `.env`이며 `.env.txt`가 아닙니다. 키를 채팅·GitHub에 공유하지 마세요. 기존 PowerShell 환경 변수에 같은 이름이 있으면 `.env`보다 우선합니다.

```dotenv
GEMINI_API_KEY=여기에_본인_API_키
GEMINI_MODEL=gemini-3.8-flash
OCR_DAILY_LIMIT=50
```

```powershell
.\.venv\Scripts\python.exe check_model.py
.\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

`check_model.py`는 설정 유무만 확인하며 API를 호출하지 않습니다. <http://127.0.0.1:8000>에서 `Ctrl+F5`로 새로고침하세요. 상단의 `Gemini 키 설정됨`은 키가 입력되었다는 뜻이며 유효성/잔여 한도를 확인한 것은 아닙니다. 설정을 바꾸면 서버를 재시작합니다.

신규 설치라면 먼저 `py -3.11 -m venv .venv`를 실행하세요. 기존 Paddle 패키지는 새 코드에서 사용하지 않습니다.

## 사진 테스트

1. 사진을 선택합니다.
2. 날짜와 옆의 **제조일자·유통기한·소비기한 문구**를 함께 선택합니다. 필요하면 `사진 전체 선택`을 누릅니다.
3. `이 영역의 날짜 읽기`를 한 번 누릅니다. 선택 영역만 JPEG로 Gemini에 보냅니다.
4. 읽은 원문과 날짜 후보를 비교해 확인합니다. 연도가 없으면 직접 확인하여 입력합니다.

우유 예시의 처리 규칙: `제조일자 03.02.00:51`, `유통기한 03.13.00:51`은 각각 날짜 후보를 만들고 `00:51`은 날짜에서 제외합니다. 연도는 임의로 채우지 않습니다. 이는 구현한 규칙이며 실제 사진 인식 성공을 보장하지는 않습니다.

표시 문구를 잘라내면 날짜 종류를 알 수 없을 수 있습니다. `직접 입력하기`는 API를 호출하지 않습니다. 확인 결과는 화면에서만 생성하며 앱 DB에 저장하지 않습니다.

## 무료 등급·호출 제어

- 사용자가 확인한 Free Tier 프로젝트 키를 사용합니다. 코드가 결제 연결이나 등급 변경을 수행하지 않습니다. 키만으로 무료 등급을 판별할 수는 없습니다.
- 실제 등급·모델별 한도는 [AI Studio](https://aistudio.google.com/)에서 확인하세요. 이후 유료 등급으로 변경하면 비용이 발생할 수 있습니다.
- 분석 1회당 이미지 1장, 요청 1회. SDK 자동 재시도·자동 함수 호출·다른 모델로 자동 전환은 하지 않습니다. 웹 검색 도구도 쓰지 않습니다.
- `OCR_DAILY_LIMIT=50`은 앱 자체의 일일 **시도 횟수** 제한이며 Google 무료 횟수가 아닙니다. Google 한도가 더 작으면 먼저 429 오류가 발생할 수 있습니다.
- 실패도 시도 횟수에 포함합니다. 한국 시간 자정 기준이며 `.local/usage.sqlite3`에 카운터만 저장하여 재시작해도 유지합니다. 사진과 키는 저장하지 않습니다.
- 다른 앱이나 서버 복사본이 같은 프로젝트로 호출한 횟수는 이 로컬 카운터에 반영되지 않습니다.
- 응답 대기 상한은 약 45초, 출력 토큰 상한은 4,096입니다. 응답의 `usage`에서 공급자가 반환한 토큰 수를 확인할 수 있습니다.
- 이미지는 Google API로 전송됩니다. 무료 서비스의 데이터 처리 조건에 맞는 테스트 사진을 사용하세요.

## 오류 구분

| 코드 | 확인할 것 |
|---|---|
| missing_api_key | `.env` 위치·파일명·키 입력 후 서버 재시작 |
| api_access | API 키와 프로젝트 접근 권한 |
| model_unavailable | 모델 이름과 계정에서 접근 가능한 모델 목록 |
| api_request | 키·모델명·지원 기능 설정 |
| provider_quota | Google 분당/일일 한도. 자동 재시도 없음 |
| local_daily_limit | 앱 자체 일일 제한. 다음 한국 날짜까지 대기 또는 직접 입력 |
| api_timeout / api_network | 인터넷 연결 또는 공급자 응답 지연 |
| incomplete_response / invalid_response | 응답 중단 또는 형식 오류. 날짜 없음과 구별 |

후보가 없으면 읽은 원문을 확인하고 표시 문구를 포함해 재선택하거나 직접 입력하세요. 오류 조사 시 키를 가린 로그만 공유하세요. 서버는 SDK 예외 원문 대신 오류 종류만 기록합니다.

## 앱 연결

`POST /ocr/expiry`: multipart `file`, `x`, `y`, `width`, `height`. 영역은 EXIF 방향을 적용한 원본 기준 0~1 좌표입니다. 사진은 10MB·2,000만 화소 이하 JPEG/PNG/WebP입니다.

스키마 `2.0`: `status`는 needs_confirmation/uncertain/no_date/retake, `requires_confirmation`은 항상 true. `candidates`에 원문·종류·경고·iso_date를 반환합니다. 연도가 없으면 iso_date=null입니다. 후보의 engine_confidence/candidate_score는 null이며 모델의 주관적 수치를 정확도로 표시하지 않습니다. `raw_text`, `ocr_lines`는 모델이 전사한 원문으로 오독 가능성이 있습니다. `usage`, `local_budget`은 토큰 수와 앱 시도 카운터입니다.

API 오류는 HTTP 4xx/5xx와 `detail: {code,message}`입니다. 사진 형식 오류 등은 문자열 detail일 수 있습니다. `integration/expiryOcr.js`는 둘 다 처리합니다. `/health`는 키 설정 유무만 반환하고 키는 반환하지 않습니다.

향후 대화 에이전트에서도 서버 인식 함수를 도구로 사용할 수 있습니다. 키는 프런트엔드에 넣지 말고 사용자가 확정한 날짜·종류만 앱 저장 API에 보내세요. 이 패키지는 localhost 테스트용이며 외부 공개 전 인증·사용자별 제한을 추가해야 합니다.

## 검증

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-test.txt
.\.venv\Scripts\python.exe -m pytest -q tests
```

날짜 검증, 업로드·영역 검사, SDK 요청 직렬화, API 계약, 한도·오류·재시도 방지 등을 테스트합니다. 외부 API는 모의 응답으로 처리하여 실제 키를 쓰지 않습니다. 실제 사진 정확도와 Windows 카메라는 사용자 PC에서 확인해야 합니다.

공식 자료: [모델](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash), [이미지 이해](https://ai.google.dev/gemini-api/docs/image-understanding), [Python SDK](https://googleapis.github.io/python-genai/).
