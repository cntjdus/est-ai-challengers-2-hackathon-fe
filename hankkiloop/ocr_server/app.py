import logging
import os
import time
from pathlib import Path
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from ocr.dates import make_gemini_result
from ocr.engine import GeminiEngine, EngineError
from ocr.images import MAX_BYTES, check_quality, load_crop
from ocr.auth import require_user

ROOT = Path(__file__).resolve().parent
app = FastAPI(title='한끼루프 날짜 OCR', version='2.2.0')
engine = GeminiEngine()
app.add_middleware(CORSMiddleware,
    allow_origins=[s.strip() for s in os.getenv('OCR_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',') if s.strip()],
    allow_credentials=False, allow_methods=['GET', 'POST'], allow_headers=['Content-Type', 'Authorization'])


@app.get('/')
def index():
    return {'service': 'Hankkiloop OCR', 'version': '2.2.0'}


@app.get('/health')
@app.get('/ocr/health')
def health():
    return {'ok':True,'api_key_configured':engine.settings.configured,'engine':'Gemini',
            'model':engine.settings.model,'local_budget':engine.budget.snapshot(),'automatic_retries':0}


def process(data, roi, quality_only=False):
    try:
        image = load_crop(data, roi)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    quality = check_quality(image)
    if quality_only:
        return quality
    if quality['contrast'] < 6 or quality['brightness'] < 20 or quality['sharpness'] < 5:
        return {'schema_version':'2.0', 'status':'retake', 'requires_confirmation':True,
                'quality':quality, 'candidates':[], 'ocr_lines':[],
                'message':'날짜에 초점을 맞추고 반사광을 피해 다시 촬영해주세요.'}
    if not engine.lock.acquire(blocking=False):
        raise HTTPException(429, '다른 사진을 처리 중이에요. 잠시 후 다시 시도해주세요.')
    try:
        start = time.perf_counter()
        payload = engine.recognize(image)
        result = make_gemini_result(payload, quality)
        result.update(engine='Gemini', model=engine.settings.model, elapsed_ms=round((time.perf_counter()-start)*1000))
        return result
    except EngineError as exc:
        logging.warning('OCR request failed: %s', exc.code)
        raise HTTPException(exc.status_code, {'code':exc.code,'message':exc.message}) from None
    except Exception as exc:
        logging.error('OCR internal failure: %s', type(exc).__name__)
        raise HTTPException(503, {'code':'internal_error','message':'인식 처리 중 오류가 발생했어요. 서버 터미널의 오류 종류를 확인해주세요.'}) from None
    finally:
        engine.lock.release()


async def read_photo(file):
    try:
        data = await file.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise HTTPException(413, '사진은 10MB 이하로 선택해주세요.')
        return data
    finally:
        await file.close()


@app.post('/ocr/expiry', dependencies=[Depends(require_user)])
async def recognize(file: UploadFile = File(...),
                    x: float = Form(...), y: float = Form(...),
                    width: float = Form(...), height: float = Form(...)):
    data = await read_photo(file)
    return await run_in_threadpool(process, data, (x,y,width,height))


@app.post('/quality', dependencies=[Depends(require_user)])
async def quality(file: UploadFile = File(...),
                  x: float = Form(...), y: float = Form(...),
                  width: float = Form(...), height: float = Form(...)):
    data = await read_photo(file)
    return await run_in_threadpool(process, data, (x,y,width,height), True)
