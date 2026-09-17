# Gemini OCR - serverless 구성

## 목적

소비기한 사진 인식을 위해 별도 `uvicorn` / Python 프로세스를 띄우지 않습니다.

- 로컬 개발: `npm run dev`의 Vite middleware가 `/api/ocr/expiry` 처리
- Vercel 배포: `api/ocr/expiry.js`가 Vercel Function으로 처리
- 공통 로직: `server/ocrService.js`

## 요청 흐름

1. 사용자가 사진에서 날짜 영역을 선택합니다.
2. 브라우저가 선택 영역만 crop합니다.
3. 긴 변을 최대 1800px로 제한하고 JPEG로 압축합니다.
4. Supabase access token과 함께 `/api/ocr/expiry`로 전송합니다.
5. 서버가 Supabase `/auth/v1/user`로 로그인 사용자를 확인합니다.
6. Gemini 3.8 Flash에 이미지 + OCR 전용 system instruction을 전달합니다.
7. JSON schema 결과를 받은 뒤 서버가 날짜 문자열과 표시 문구를 다시 보수적으로 검증합니다.
8. 결과는 자동 저장하지 않고 사용자가 사진과 비교해 확인한 경우에만 입력란에 반영합니다.

## 재시도

다음 오류만 자동으로 한 번 재시도합니다.

- Gemini 5xx
- 네트워크 연결 오류
- 요청 timeout

다음은 재시도하지 않습니다.

- 400 잘못된 요청
- 401/403 API 접근 문제
- 404 모델 접근 문제
- 429 호출 한도

## 이미지 크기

Vercel Function 요청 payload 제한에 여유를 두기 위해 브라우저에서 OCR 이미지 자체를 약 1.4MB 이하로 압축합니다.
원본 사진은 서버로 그대로 보내지 않습니다.

## 보안

- `GEMINI_API_KEY`는 서버에서만 사용합니다.
- `VITE_GEMINI_API_KEY`를 만들지 않습니다.
- 로그인하지 않은 사용자의 OCR 요청은 Gemini 호출 전에 거부됩니다.
- 이미지 안의 문장은 untrusted data로 취급하고 system instruction 변경 명령을 따르지 않습니다.
- AI가 만든 날짜를 DB에 자동 저장하지 않습니다.

## 배포

Vercel Environment Variables에 다음을 등록합니다.

- `GEMINI_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` 또는 `VITE_SUPABASE_ANON_KEY`

`vercel.json`은 `/api/*`를 SPA fallback에서 제외합니다.
