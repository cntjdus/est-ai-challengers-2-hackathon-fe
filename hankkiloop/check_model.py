from ocr.config import Settings
if __name__ == '__main__':
    s=Settings()
    print('설정 확인 (API 호출 없음)')
    print('API 키:', '설정됨' if s.configured else '미설정 — .env를 확인해주세요')
    print('모델:',s.model)
    print('앱 자체 일일 시도 제한:',s.daily_limit)
    print('무료 등급 및 실제 한도는 AI Studio에서 확인해주세요.')
    raise SystemExit(0 if s.configured else 1)
