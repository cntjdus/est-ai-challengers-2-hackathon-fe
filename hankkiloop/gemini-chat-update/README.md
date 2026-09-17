# 한끼루프 Gemini 채팅 업데이트

기준 저장소: `cntjdus/est-ai-challengers-2-hackathon-fe`의 현재 `main`.

## 적용

이 폴더를 `hankkiloop` 프로젝트 안이나 상위 폴더에 압축 해제한 뒤 PowerShell에서 실행합니다.

현재 위치가 `C:\...\est\hankkiloop`이면:

```powershell
node .\gemini-chat-update\apply-gemini-chat.cjs . --check
node .\gemini-chat-update\apply-gemini-chat.cjs .
```

업데이트 폴더를 `C:\...\est`에 풀었다면:

```powershell
node .\gemini-chat-update\apply-gemini-chat.cjs . --check
node .\gemini-chat-update\apply-gemini-chat.cjs .
```

적용기는 `hankkiloop/package.json`을 자동 탐색합니다. 기존 파일은 프로젝트 내부의
`.gemini-chat-backup-날짜` 폴더에 복사한 뒤 교체합니다. `.env.local`은 건드리지 않습니다.

## 환경 변수

`hankkiloop/.env.local`:

```dotenv
GEMINI_API_KEY=발급받은_키
```

`VITE_GEMINI_API_KEY`로 작성하지 마세요. `VITE_` 접두어는 클라이언트 번들에 노출될 수 있습니다.

## 검사

```powershell
node .\scripts\test-gemini-chat.mjs
npm test
npm run build
npm run dev
```

Vercel 배포 시에는 프로젝트 Settings → Environment Variables에도
`GEMINI_API_KEY`를 추가하고 재배포해야 합니다.

상세 내용은 적용 후 `docs/GEMINI_CHAT_SETUP.md`를 확인하세요.
